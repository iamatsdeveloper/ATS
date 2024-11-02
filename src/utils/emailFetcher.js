import dotenv from "dotenv";
import Imap from "imap";
import { simpleParser } from "mailparser";
import { handleTrade } from "../controllers/tradeController.js";

// Load environment variables
dotenv.config();

class EmailFetcher {
    constructor() {
        this.imapConfig = {
            user: process.env.GMAIL_USER,
            password: process.env.GMAIL_PASS,
            host: 'imap.gmail.com',
            port: 993,
            tls: true,
            tlsOptions: {
                rejectUnauthorized: false,
            },
        };

        this.imap = new Imap(this.imapConfig);
        this.setupListeners();
        this.intervalId = null; // Store the interval ID
    }

    setupListeners() {
        this.imap.once('ready', () => {
            console.log('IMAP connection is ready.');
            this.fetchUnreadEmails(); // Initial fetch
        });

        this.imap.once('error', (err) => {
            console.error('IMAP Error: ', err);
        });

        this.imap.once('end', () => {
            console.log('Connection ended');
        });
    }

    async connect() {
        try {
            this.imap.connect();
        } catch (error) {
            console.error('Error connecting to IMAP:', error);
        }
    }

    openInbox() {
        return new Promise((resolve, reject) => {
            this.imap.openBox('INBOX', false, (err, box) => {
                if (err) {
                    return reject(err);
                }
                resolve(box);
            });
        });
    }

    async processNewEmail(email) {

        const from = email.from.value[0];
        const fromName = from.name;
        
        if(fromName == "TradingView" && email.subject === "Alert: 5EMA-RSI Buy/Sell") {
            const jsondata = JSON.parse(email.text.replace("\n", ""), null, 2);
            await handleTrade(jsondata, email.date);
            console.log("success");
        }
    }

    async fetchUnreadEmails() {
        try {
            await this.openInbox();

            this.imap.search(['UNSEEN'], (err, results) => {
                if (err) throw err;

                if (results.length === 0) {
                    console.log('No new emails.');
                    return;
                }

                const f = this.imap.fetch(results, { bodies: '' });
                f.on('message', (msg) => {
                    msg.on('body', (stream) => {
                        simpleParser(stream, (err, email) => {
                            if (err) throw err;
                            this.processNewEmail(email);
                        });
                    });

                    msg.once('attributes', (attrs) => {
                        const uid = attrs.uid;
                        this.imap.addFlags(uid, ['\\Seen'], (err) => {
                            if (err) throw err;
                            console.log('Marked as read!');
                        });
                    });
                });

                f.on('end', () => {
                    console.log('Done fetching new messages!');
                });
            });
        } catch (error) {
            console.error('Error fetching emails:', error);
        }
    }

    startPolling(interval = 60000) {
        // Check if already polling to avoid multiple intervals
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }

        this.intervalId = setInterval(() => {
            this.fetchUnreadEmails();
        }, interval);
    }

    stopPolling() {
        // Clear the interval if it's set
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null; // Reset the interval ID
        }
    }
}

export default EmailFetcher;