# Gmail Auto-Reply with GenAI

This project is a backend server that integrates Google OAuth2 for Gmail API access and uses GenAI to generate automatic replies to incoming emails. It includes a web interface for Google authentication and a background job processing system for handling email replies.

## Features

- **Google OAuth2 Authentication**: Secure sign-in with Google and access Gmail API.
- **Email Processing**: Automatically fetches unread emails and generates replies using GenAI.
- **Job Queue Management**: Utilizes BullMQ for managing email processing jobs.
- **GenAI Integration**: Generates professional email replies using Google's generative AI service.

## Getting Started

### Prerequisites

- **Node.js**: Ensure you have Node.js installed (version 18 or later is recommended).
- **Redis**: BullMQ requires Redis to manage job queues. Install and run Redis on your local machine or use a cloud service.

### Installation

1. **Clone the Repository**

   ```bash
   git clone https://github.com/KD30062000/ReachInbox.git
   cd gmail-auto-reply
