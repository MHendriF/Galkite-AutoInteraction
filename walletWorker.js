import { parentPort, workerData } from 'worker_threads';
import fetch from 'node-fetch';
import HttpsProxyAgent from 'https-proxy-agent';
import chalk from 'chalk';

const { privateKey, proxyUrl } = workerData;

// Helper function for delay
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function processWallet(privateKey, proxyUrl) {
  try {
    const postUrl =
      'https://quests-usage-dev.prod.zettablock.com/api/report_usage';
    const interactions = [
      {
        agent_id: 'deployment_p5J9lz1Zxe7CYEoo0TZpRVay',
        request_text: 'What is Kite AI?',
        response_text:
          'Kite AI is a purpose-built Layer 1 blockchain designed for the AI economy...',
      },
      {
        agent_id: 'deployment_p5J9lz1Zxe7CYEoo0TZpRVay',
        request_text: 'How does Kite AI work?',
        response_text:
          'Kite AI uses Proof of AI (PoAI) to enable transparent collaboration...',
      },
    ];

    const loops = 10; // Number of interactions per wallet
    const agent = new HttpsProxyAgent(proxyUrl);

    for (let i = 1; i <= loops; i++) {
      console.log(
        chalk.blue(
          `\n🔁 Loop ${i} of ${loops} for wallet: ${privateKey.slice(0, 6)}...`
        )
      );

      const { agent_id, request_text, response_text } =
        interactions[i % interactions.length];

      const postPayload = {
        wallet_address: privateKey,
        agent_id,
        request_text,
        response_text,
        request_metadata: null,
      };

      const headers = {
        Accept: '*/*',
        'Content-Type': 'application/json',
      };

      try {
        const response = await fetch(postUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(postPayload),
          agent,
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `POST request failed: ${response.status}\nServer Response: ${errorText}`
          );
        }

        const data = await response.json();
        const interactionId = data.interaction_id;
        if (!interactionId)
          throw new Error('interaction_id not found in the POST response!');
        console.log(
          chalk.green(`✅ Success! Got interaction ID: ${interactionId}`)
        );

        // Simulate submitting interaction
        console.log(chalk.blue(`Submitting interaction (${interactionId})...`));
        await delay(2000); // Simulate delay for submission
      } catch (error) {
        console.error(chalk.red(`❌ Error during loop ${i}:`, error.message));
        if (error.message.includes('Too many requests')) {
          console.log(
            chalk.yellow('⏳ Rate limit hit. Retrying in 1 minute...')
          );
          await delay(60000); // Wait 1 minute before retrying
        }
      }

      console.log(
        chalk.magenta('🕐 Waiting 5 seconds before next transaction...')
      );
      await delay(5000); // Wait 5 seconds between transactions
    }

    parentPort.postMessage(
      `Completed processing for wallet: ${privateKey.slice(0, 6)}...`
    );
  } catch (error) {
    console.error(chalk.red(`❌ Error processing wallet:`, error.message));
    parentPort.postMessage(`Error processing wallet: ${error.message}`);
  }
}

// Start processing the wallet
processWallet(privateKey, proxyUrl);
