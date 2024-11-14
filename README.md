# FarcasterDog Bot

An automated bot for FarcasterDog that handles daily tasks and main tasks for multiple accounts.

## Features

- Multiple account support (one cookie per line)
- Automated daily tasks completion
- Automated main tasks processing
- Points tracking and management
- Colorful console output
- Auto retry and error handling
- Countdown timer between actions

## Prerequisites

- Node.js v16 or higher
- NPM or Yarn package manager
- Active FarcasterDog account (Register [here](https://farcasterdog.xyz/referral/537536))

## Installation

1. Clone this repository:

```bash
git clone https://github.com/Galkurta/FarcasterDog-BOT.git
cd FarcasterDog-BOT
```

2. Install dependencies:

```bash
npm install
```

## Configuration

1. Edit `data.txt` file in the root directory
2. Add your account cookies (one per line)
3. Make sure the cookies are valid and logged in

Example `data.txt`:

```
eyj
eyj
eyj
```

## Usage

Start the bot:

```bash
node main.js
```

Stop the bot:

- Press `Ctrl + C`
- The bot will finish current tasks and exit gracefully

## Getting Your Cookie

1. Login to [FarcasterDog](https://farcasterdog.xyz/referral/537536)
2. Open browser developer tools (F12)
3. Go to Network tab
4. Find any request to api.farcasterdog.xyz
5. Copy the value of the `token` cookie
6. Paste it into cookie.txt (one cookie per line for multiple accounts)

## Features Detail

- **Daily Tasks**: Automatically completes daily tasks for points
- **Main Tasks**: Handles main tasks for additional points
- **Multi Account**: Process multiple accounts sequentially
- **Auto Retry**: Retries failed tasks with delay
- **Point Tracking**: Tracks and displays points earned
- **Error Handling**: Graceful error handling and logging

## Safety Features

- Delays between requests to prevent rate limiting
- Account status verification before operations
- Secure cookie management
- Exit handlers for graceful shutdown

## Troubleshooting

If you encounter issues:

1. Verify your cookie is valid and not expired
2. Check your internet connection
3. Ensure you have the latest version
4. Check console for error messages

## Notes

- One cookie per line in cookie.txt
- Bot uses delays between actions to prevent rate limiting
- Invalid cookies will be skipped automatically
- Logs show real-time progress and points earned

## Disclaimer

This bot is for educational purposes only. Use at your own risk. Please follow FarcasterDog's terms of service.

## License

MIT License - feel free to use and modify as needed.
