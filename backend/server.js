// Using GenAi
import { TextServiceClient } from "@google-ai/generativelanguage";
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { OAuth2Client, GoogleAuth } from 'google-auth-library';
import { google } from 'googleapis';
import dotenv from 'dotenv';
import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import axios from 'axios';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = `http://localhost:${port}/auth/google/callback`;
const GENAI_API_URL = process.env.GENAI_API_URL || "https://generativelanguage.googleapis.com";
const GENAI_API_KEY = process.env.GENAI_API_KEY;

// Initialize OAuth2Client
const oauth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

// Handle __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from the 'frontend' directory
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Initialize BullMQ
const connection = {
    host: 'localhost',
    port: 6379,
    maxRetriesPerRequest: null,
};
const emailQueue = new Queue('emailQueue', { connection });

// Secure token storage (replace with your database solution)
let tokenStorage = {};

// Save tokens securely
async function saveTokens(userId, tokens) {
    tokenStorage[userId] = tokens;
    console.log(`Tokens saved for user: ${userId}`);
}

// Retrieve tokens
async function getTokens(userId) {
    const tokens = tokenStorage[userId];
    console.log(`Retrieved tokens for user: ${userId}`, tokens ? 'Tokens found' : 'No tokens found');
    return tokens;
}

// Google OAuth2 authorization
app.get('/auth/google', (req, res) => {
    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: [
            'https://www.googleapis.com/auth/gmail.modify',
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/gmail.compose'
        ]
    });
    console.log('Redirecting to Google OAuth URL:', authUrl);
    res.redirect(authUrl);
});

app.get('/auth/google/callback', async (req, res) => {
    const { code } = req.query;
    console.log('Received OAuth callback with code:', code);
    try {
        const { tokens } = await oauth2Client.getToken(code);
        console.log('Received tokens from Google:', tokens);
        const userInfo = await getUserInfo(tokens);
        console.log('User info retrieved:', userInfo.email);
        await saveTokens(userInfo.email, tokens);

        console.log('Adding job to the email queue for processing emails...');
        await emailQueue.add('processEmails', { userId: userInfo.email });
        console.log('Job added to the email queue.');

        res.send('Email processing job has been queued. Check your console for updates.');
    } catch (error) {
        console.error('Error in OAuth callback:', error);
        res.status(500).send('Authentication failed: ' + error.message);
    }
});

async function getUserInfo(tokens) {
    console.log('Getting user info');
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    oauth2Client.setCredentials(tokens);
    const userInfoResponse = await oauth2.userinfo.get();
    return userInfoResponse.data;
}

// Worker to process emails from the queue
const worker = new Worker('emailQueue', async job => {
    const { userId } = job.data;
    console.log(`Processing emails for user: ${userId}`);
    let lastCheckedTime = new Date();

    try {
        await processNewEmails(userId, lastCheckedTime);
        console.log(`Emails processed for user: ${userId}`);
    } catch (error) {
        console.error('Error processing emails:', error);
    }
}, { connection });

// Process new emails
async function processNewEmails(userId, lastCheckedTime) {
    console.log(`Processing new emails for user: ${userId}`);
    try {
        const tokens = await getTokens(userId);
        if (!tokens) throw new Error('No tokens found for user');

        oauth2Client.setCredentials(tokens);
        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

        // Calculate the timestamp for 2 hours ago
        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
        const formattedDateTime = twoHoursAgo.toISOString();
        console.log(`Fetching unread emails after: ${formattedDateTime}`);

        const res = await gmail.users.messages.list({
            userId: 'me',
            q: `after:${Math.floor(twoHoursAgo.getTime() / 1000)} is:unread label:inbox`
        });

        console.log('Gmail API response:', res.data);

        const messages = res.data.messages || [];
        console.log(`Found ${messages.length} new unread message(s)`);

        if (messages.length === 0) {
            console.log('No new unread messages found.');
            return;
        }

        for (const message of messages) {
            console.log(`Fetching full message for ID: ${message.id}`);
            const fullMessage = await gmail.users.messages.get({
                userId: 'me',
                id: message.id
            });

            const body = getBody(fullMessage.data.payload);
            console.log('Email body:', body);

            const replyContent = await generateReplyWithGenAI(body);
            console.log('Generated reply:', replyContent);

            await sendGenAIReply(gmail, fullMessage.data, replyContent);

            await gmail.users.messages.modify({
                userId: 'me',
                id: message.id,
                requestBody: {
                    removeLabelIds: ['UNREAD']
                }
            });

            console.log(`Marked message ${message.id} as read.`);
        }

    } catch (error) {
        console.error('Error processing new emails:', error);
    }
}

// Helper function to get the body of the email
function getBody(payload) {
    let body = '';

    if (!payload) {
        console.error('Payload is undefined');
        return body;
    }

    if (payload.parts && Array.isArray(payload.parts)) {
        for (const part of payload.parts) {
            if (part.mimeType === 'text/plain' && part.body && part.body.data) {
                body += Buffer.from(part.body.data, 'base64').toString('utf-8');
            } else if (part.mimeType === 'text/html' && part.body && part.body.data) {
                body += Buffer.from(part.body.data, 'base64').toString('utf-8');
            } else if (part.parts && Array.isArray(part.parts)) {
                body += getBody(part);
            }
        }
    } else if (payload.body && payload.body.data) {
        body = Buffer.from(payload.body.data, 'base64').toString('utf-8');
    } else {
        console.error('No suitable body found in the email');
    }

    return body;
}

const auth = new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/cloud-platform']
  });

  async function generateReplyWithGenAI(emailContent) {
    try {
        const client = await auth.getClient();
        const accessToken = await client.getAccessToken();

        const response = await axios.post(`${GENAI_API_URL}/v1beta/models/text-bison-001:generateText`, {
            prompt: {
                text: `Please generate a polite and professional reply to the following email:\n\n${emailContent}`
            },
            temperature: 0.7,
            candidateCount: 1,
            maxOutputTokens: 1024,
        }, {
            headers: {
                'Authorization': `Bearer ${accessToken.token}`,
                'Content-Type': 'application/json',
            }
        });

        if (response.data && response.data.candidates && response.data.candidates.length > 0) {
            return response.data.candidates[0].output;
        } else {
            console.error('Unexpected response structure:', response.data);
            return 'I apologize, but I am unable to generate a suitable reply at this time. Please check your email later.';
        }
    } catch (error) {
        console.error('Error generating reply with GenAI:', error.response ? error.response.data : error.message);
        if (error.response && error.response.status === 401) {
            console.error('Authentication failed. Please check your Google Cloud credentials.');
        }
        return 'I apologize, but I am unable to generate a suitable reply at this time. Please check your email later.';
    }
}

// Send the generated reply
async function sendGenAIReply(gmail, message, replyContent) {
    const headers = message.payload.headers;
    const to = headers.find(h => h.name === 'From').value;
    const subject = headers.find(h => h.name === 'Subject')?.value || 'No Subject';

    console.log(`Preparing to send GenAI reply to: ${to}, Subject: ${subject}`);

    const replyMessage = {
        userId: 'me',
        resource: {
            raw: Buffer.from(
                `To: ${to}\r\n` +
                `Subject: Re: ${subject}\r\n` +
                `Content-Type: text/plain; charset="UTF-8"\r\n` +
                `Content-Transfer-Encoding: 7bit\r\n\r\n` +
                `${replyContent}`
            ).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
        }
    };

    try {
        const response = await gmail.users.messages.send(replyMessage);
        console.log('Reply sent successfully:', response.data);
    } catch (error) {
        console.error('Error sending GenAI reply:', error);
    }
}

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});