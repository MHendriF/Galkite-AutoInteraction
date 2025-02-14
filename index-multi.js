import { Worker } from 'worker_threads';
import fs from 'fs';
import chalk from 'chalk';

// Helper function to create a worker for each wallet
function runWalletWorker(privateKey, proxyUrl) {
  return new Promise((resolve, reject) => {
    const worker = new Worker('./walletWorker.js', {
      workerData: { privateKey, proxyUrl },
    });
    worker.on('message', (message) => {
      console.log(
        chalk.green(`✅ Wallet ${privateKey.slice(0, 6)}...: ${message}`)
      );
      resolve();
    });
    worker.on('error', (error) => {
      console.error(
        chalk.red(
          `❌ Error in wallet ${privateKey.slice(0, 6)}...:`,
          error.message
        )
      );
      reject(error);
    });
    worker.on('exit', (code) => {
      if (code !== 0) {
        console.error(
          chalk.red(
            `❌ Worker for wallet ${privateKey.slice(
              0,
              6
            )}... exited with code ${code}`
          )
        );
        reject(new Error(`Worker exited with code ${code}`));
      }
    });
  });
}

async function main() {
  try {
    // Read wallets and proxies from files
    const wallets = fs
      .readFileSync('wallets.txt', 'utf8')
      .split('\n')
      .filter(Boolean);
    const proxies = fs
      .readFileSync('proxy.txt', 'utf8')
      .split('\n')
      .filter(Boolean);
    if (wallets.length === 0 || proxies.length === 0) {
      throw new Error('No wallets or proxies found in the respective files.');
    }
    console.log(
      chalk.cyan(
        `Loaded ${wallets.length} wallets and ${proxies.length} proxies.`
      )
    );
    // Ensure each wallet has a corresponding proxy
    const walletProxyPairs = wallets.map((wallet, index) => ({
      privateKey: wallet,
      proxyUrl: proxies[index % proxies.length],
    }));
    // Run all wallets in parallel using workers
    const workerPromises = walletProxyPairs.map(({ privateKey, proxyUrl }) =>
      runWalletWorker(privateKey, proxyUrl)
    );
    await Promise.all(workerPromises); // Wait for all workers to finish
    console.log(chalk.green('✅ All wallet tasks completed.'));
  } catch (error) {
    console.error(chalk.red('❌ Fatal Error:', error.message));
  }
}

// Function to run the main function every 12 hours
function runEvery12Hours() {
  const twelveHoursInMilliseconds = 12 * 60 * 60 * 1000; // 12 hours in milliseconds

  // Run the main function immediately
  main();

  // Set up an interval to run the main function every 12 hours
  setInterval(() => {
    console.log(chalk.yellow('⏳ Waiting 12 hours before running again...'));
    main();
  }, twelveHoursInMilliseconds);
}

// Start the process
runEvery12Hours();
