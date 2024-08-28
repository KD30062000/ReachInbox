// const express = require('express');
// const path = require('path');
// const { OAuth2Client } = require('google-auth-library');
// const dotenv = require('dotenv');

// dotenv.config();

// const app = express();
// const port = process.env.PORT || 3000;

// const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
// const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
// const REDIRECT_URI = `http://localhost:${port}/auth/google/callback`;

// const oauth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

// // Serve static files from the 'frontend' directory
// app.use(express.static(path.join(__dirname, '..', 'frontend')));

// app.get('/auth/google', (req, res) => {
//   const authUrl = oauth2Client.generateAuthUrl({
//     access_type: 'offline',
//     scope: ['https://www.googleapis.com/auth/userinfo.profile', 'https://www.googleapis.com/auth/userinfo.email']
//   });
//   res.redirect(authUrl);
// });

// app.get('/auth/google/callback', async (req, res) => {
//   const { code } = req.query;
//   try {
//     const { tokens } = await oauth2Client.getToken(code);
//     oauth2Client.setCredentials(tokens);
    
//     res.send(`
//       <script>
//         window.opener.postMessage({ token: '${tokens.access_token}' }, '*');
//         window.close();
//       </script>
//     `);
//   } catch (error) {
//     console.error('Error getting tokens:', error);
//     res.status(500).send('Authentication failed');
//   }
// });

// app.listen(port, () => {
//   console.log(`Server running at http://localhost:${port}`);
// });






// New Code
// const express = require('express');
// const path = require('path');
// const { OAuth2Client } = require('google-auth-library');
// const { google } = require('googleapis');
// const dotenv = require('dotenv');
// const Queue = require('bull');

// dotenv.config();

// const app = express();
// const port = process.env.PORT || 3000;

// const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
// const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
// const REDIRECT_URI = `http://localhost:${port}/auth/google/callback`;

// const oauth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

// // Create a Bull queue for email processing
// const emailQueue = new Queue('email-processing', process.env.REDIS_URL);

// // Serve static files from the 'frontend' directory
// app.use(express.static(path.join(__dirname, '..', 'frontend')));

// app.get('/auth/google', (req, res) => {
//   const authUrl = oauth2Client.generateAuthUrl({
//     access_type: 'offline',
//     scope: ['https://www.googleapis.com/auth/gmail.modify','https://www.googleapis.com/auth/userinfo.profile', 'https://www.googleapis.com/auth/userinfo.email']
//     // scope: ['https://www.googleapis.com/auth/userinfo.profile', 'https://www.googleapis.com/auth/userinfo.email','https://www.googleapis.com/auth/gmail.readonly']
//   });
//   res.redirect(authUrl);
// });

// app.get('/auth/google/callback', async (req, res) => {
//   const { code } = req.query;
//   try {
//     const { tokens } = await oauth2Client.getToken(code);
//     oauth2Client.setCredentials(tokens);
    
//     // Start the email processing
//     await processEmails(oauth2Client);

//     res.send(`
//       <script>
//         window.opener.postMessage({ success: true }, '*');
//         window.close();
//       </script>
//     `);
//   } catch (error) {
//     console.error('Error getting tokens:', error);
//     res.status(500).send('Authentication failed');
//   }
// });

// async function processEmails(auth) {
//   const gmail = google.gmail({ version: 'v1', auth });

//   try {
//     const res = await gmail.users.messages.list({
//       userId: 'me',
//       q: 'is:unread'
//     });

//     const messages = res.data.messages || [];

//     for (const message of messages) {
//       await emailQueue.add('process-email', {
//         messageId: message.id,
//         auth: auth.credentials
//       });
//     }
//   } catch (error) {
//     console.error('Error fetching emails:', error);
//   }
// }

// // Define the email processing job
// emailQueue.process('process-email', async (job) => {
//   const { messageId, auth } = job.data;
//   const gmail = google.gmail({ version: 'v1', auth: new OAuth2Client().setCredentials(auth) });

//   try {
//     // Fetch the full message
//     const message = await gmail.users.messages.get({
//       userId: 'me',
//       id: messageId
//     });

//     // Process the message (e.g., send an auto-reply)
//     await sendAutoReply(gmail, message.data);

//     // Mark the message as read
//     await gmail.users.messages.modify({
//       userId: 'me',
//       id: messageId,
//       requestBody: {
//         removeLabelIds: ['UNREAD']
//       }
//     });

//     console.log(`Processed email: ${messageId}`);
//   } catch (error) {
//     console.error(`Error processing email ${messageId}:`, error);
//   }
// });

// async function sendAutoReply(gmail, message) {
//   const headers = message.payload.headers;
//   const to = headers.find(h => h.name === 'From').value;
//   const subject = headers.find(h => h.name === 'Subject').value;

//   const replyMessage = {
//     userId: 'me',
//     resource: {
//       raw: Buffer.from(
//         `To: ${to}\r\n` +
//         `Subject: Re: ${subject}\r\n` +
//         `Content-Type: text/plain; charset="UTF-8"\r\n` +
//         `Content-Transfer-Encoding: 7bit\r\n\r\n` +
//         `Thank you for your email. This is an automatic reply.`
//       ).toString('base64')
//     }
//   };

//   await gmail.users.messages.send(replyMessage);
// }

// app.listen(port, () => {
//   console.log(`Server running at http://localhost:${port}`);
// });

// New Code

// import express from 'express';
// import path from 'path';
// import { fileURLToPath } from 'url'; // New import to handle __dirname
// import { OAuth2Client } from 'google-auth-library';
// import { google } from 'googleapis';
// import dotenv from 'dotenv';
// import Queue from 'bull';
// import OpenAI from 'openai';

// dotenv.config();

// const app = express();
// const port = process.env.PORT || 3000;

// const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
// const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
// const REDIRECT_URI = `http://localhost:${port}/auth/google/callback`;
// const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// const oauth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

// // Create a Bull queue for email processing
// const emailQueue = new Queue('email-processing', process.env.REDIS_URL);

// // Initialize OpenAI client
// const openai = new OpenAI({
//     apiKey: OPENAI_API_KEY
// });

// // Handle __dirname in ES Modules
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// // Serve static files from the 'frontend' directory
// app.use(express.static(path.join(__dirname, '..', 'frontend')));

// app.get('/auth/google', (req, res) => {
//     const authUrl = oauth2Client.generateAuthUrl({
//         access_type: 'offline',
//         // scope: [
//         //     // 'https://www.googleapis.com/auth/gmail.modify',
//         //     'https://www.googleapis.com/auth/userinfo.profile',
//         //     'https://www.googleapis.com/auth/userinfo.email'
//         // ]
//         scope: [
//             'https://www.googleapis.com/auth/gmail.modify',   // Required for modifying messages
//             'https://www.googleapis.com/auth/gmail.readonly', // Read access to Gmail messages
//             'https://www.googleapis.com/auth/gmail.metadata', // Access to message metadata
//             'https://www.googleapis.com/auth/userinfo.profile',
//             'https://www.googleapis.com/auth/userinfo.email'
//         ]
//     });
//     res.redirect(authUrl);
// });

// app.get('/auth/google/callback', async (req, res) => {
//     const { code } = req.query;
//     try {
//         const { tokens } = await oauth2Client.getToken(code);
//         oauth2Client.setCredentials(tokens);
        
//         // Start the email processing
//         await processEmails(oauth2Client);

//         res.send(`
//             <script>
//                 window.opener.postMessage({ success: true }, '*');
//                 window.close();
//             </script>
//         `);
//     } catch (error) {
//         console.error('Error getting tokens:', error);
//         res.status(500).send('Authentication failed');
//     }
// });

// async function processEmails(auth) {
//     const gmail = google.gmail({ version: 'v1', auth });

//     try {
//         const res = await gmail.users.messages.list({
//             userId: 'me',
//             // q: 'is:unread'
//         });

//         const messages = res.data.messages || [];

//         for (const message of messages) {
//             await emailQueue.add('process-email', {
//                 messageId: message.id,
//                 auth: auth.credentials
//             });
//         }
//     } catch (error) {
//         console.error('Error fetching emails:', error);
//     }
// }

// // Define the email processing job
// emailQueue.process('process-email', async (job) => {
//     const { messageId, auth } = job.data;
//     const gmail = google.gmail({ version: 'v1', auth: new OAuth2Client().setCredentials(auth) });

//     try {
//         // Fetch the full message
//         const message = await gmail.users.messages.get({
//             userId: 'me',
//             id: messageId
//         });

//         // Extract the email content
//         const emailContent = getEmailContent(message.data);

//         // Generate a reply using OpenAI
//         const aiReply = await generateAIReply(emailContent);

//         // Send the AI-generated reply
//         await sendAutoReply(gmail, message.data, aiReply);

//         // Mark the message as read
//         await gmail.users.messages.modify({
//             userId: 'me',
//             id: messageId,
//             requestBody: {
//                 removeLabelIds: ['UNREAD']
//             }
//         });

//         console.log(`Processed email: ${messageId}`);
//     } catch (error) {
//         console.error(`Error processing email ${messageId}:`, error);
//     }
// });

// function getEmailContent(message) {
//     const payload = message.payload;
//     const parts = payload.parts || [];
//     let emailContent = '';

//     if (payload.mimeType === 'text/plain') {
//         emailContent = Buffer.from(payload.body.data, 'base64').toString('utf-8');
//     } else {
//         for (const part of parts) {
//             if (part.mimeType === 'text/plain') {
//                 emailContent = Buffer.from(part.body.data, 'base64').toString('utf-8');
//                 break;
//             }
//         }
//     }
//     return emailContent;
// }

// async function generateAIReply(emailContent) {
//     const completion = await openai.chat.completions.create({
//         model: "gpt-4",
//         messages: [{ role: "user", content: emailContent }],
//         max_tokens: 150
//     });

//     return completion.choices[0].message.content.trim();
// }

// async function sendAutoReply(gmail, message, aiReply) {
//     const headers = message.payload.headers;
//     const to = headers.find(h => h.name === 'From').value;
//     const subject = headers.find(h => h.name === 'Subject').value;

//     const replyMessage = {
//         userId: 'me',
//         resource: {
//             raw: Buffer.from(
//                 `To: ${to}\r\n` +
//                 `Subject: Re: ${subject}\r\n` +
//                 `Content-Type: text/plain; charset="UTF-8"\r\n` +
//                 `Content-Transfer-Encoding: 7bit\r\n\r\n` +
//                 `${aiReply}`
//             ).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
//         }
//     };

//     await gmail.users.messages.send(replyMessage);
// }

// app.listen(port, () => {
//     console.log(`Server running at http://localhost:${port}`);
// });


// New Code
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
import dotenv from 'dotenv';
import Queue from 'bull';
import OpenAI from 'openai';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = `http://localhost:${port}/auth/google/callback`;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const REDIS_URL = process.env.REDIS_URL;

// Initialize OAuth2Client
const oauth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

// Initialize Bull queue for email processing
const emailQueue = new Queue('email-processing', REDIS_URL);

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: OPENAI_API_KEY
});

// Handle __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from the 'frontend' directory
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Google OAuth2 authorization
app.get('/auth/google', (req, res) => {
    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: [
            'https://www.googleapis.com/auth/gmail.modify',
            'https://www.googleapis.com/auth/gmail.readonly',
            'https://www.googleapis.com/auth/gmail.metadata',
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/userinfo.email'
        ]
    });
    res.redirect(authUrl);
});

// Google OAuth2 callback
app.get('/auth/google/callback', async (req, res) => {
    const { code } = req.query;
    try {
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        // Store tokens securely
        saveTokensToDatabase(tokens);

        // Start email processing
        await processEmails(oauth2Client);

        res.send(`
            <script>
                window.opener.postMessage({ success: true }, '*');
                window.close();
            </script>
        `);
    } catch (error) {
        console.error('Error getting tokens:', error);
        res.status(500).send('Authentication failed');
    }
});

// Refresh access token
async function refreshToken() {
    try {
        const { tokens } = await oauth2Client.refreshToken(oauth2Client.credentials.refresh_token);
        oauth2Client.setCredentials(tokens);
        updateTokensInDatabase(tokens);
        return tokens;
    } catch (error) {
        console.error('Error refreshing token:', error);
        throw error;
    }
}

// Process emails
async function processEmails(auth) {
    const gmail = google.gmail({ version: 'v1', auth });

    try {
        const res = await gmail.users.messages.list({
            userId: 'me'
        });

        const messages = res.data.messages || [];

        for (const message of messages) {
            await emailQueue.add('process-email', {
                messageId: message.id,
                auth: auth.credentials
            });
        }
    } catch (error) {
        if (error.response && error.response.status === 401) {
            try {
                const tokens = await refreshToken();
                await processEmails(oauth2Client.setCredentials(tokens));
            } catch (refreshError) {
                console.error('Error refreshing token:', refreshError);
            }
        } else {
            console.error('Error fetching emails:', error);
        }
    }
}

// Define the email processing job
emailQueue.process('process-email', async (job) => {
    const { messageId, auth } = job.data;
    const gmail = google.gmail({ version: 'v1', auth: new OAuth2Client().setCredentials(auth) });

    try {
        const message = await gmail.users.messages.get({
            userId: 'me',
            id: messageId
        });

        const emailContent = getEmailContent(message.data);
        const aiReply = await generateAIReply(emailContent);

        await sendAutoReply(gmail, message.data, aiReply);

        await gmail.users.messages.modify({
            userId: 'me',
            id: messageId,
            requestBody: {
                removeLabelIds: ['UNREAD']
            }
        });

        console.log(`Processed email: ${messageId}`);
    } catch (error) {
        console.error(`Error processing email ${messageId}:`, error);
    }
});

// Extract email content
function getEmailContent(message) {
    const payload = message.payload;
    const parts = payload.parts || [];
    let emailContent = '';

    if (payload.mimeType === 'text/plain') {
        emailContent = Buffer.from(payload.body.data, 'base64').toString('utf-8');
    } else {
        for (const part of parts) {
            if (part.mimeType === 'text/plain') {
                emailContent = Buffer.from(part.body.data, 'base64').toString('utf-8');
                break;
            }
        }
    }
    return emailContent;
}

// Generate AI reply
async function generateAIReply(emailContent) {
    const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: emailContent }],
        max_tokens: 150
    });

    return completion.choices[0].message.content.trim();
}

// Send auto-reply
async function sendAutoReply(gmail, message, aiReply) {
    const headers = message.payload.headers;
    const to = headers.find(h => h.name === 'From').value;
    const subject = headers.find(h => h.name === 'Subject').value;

    const replyMessage = {
        userId: 'me',
        resource: {
            raw: Buffer.from(
                `To: ${to}\r\n` +
                `Subject: Re: ${subject}\r\n` +
                `Content-Type: text/plain; charset="UTF-8"\r\n` +
                `Content-Transfer-Encoding: 7bit\r\n\r\n` +
                `${aiReply}`
            ).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
        }
    };

    await gmail.users.messages.send(replyMessage);
}

// Save tokens to database (dummy implementation)
function saveTokensToDatabase(tokens) {
    // Implement your secure storage solution
    console.log('Saving tokens:', tokens);
}

// Update tokens in database (dummy implementation)
function updateTokensInDatabase(tokens) {
    // Implement your secure storage solution
    console.log('Updating tokens:', tokens);
}

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
