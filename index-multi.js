import { Worker } from 'worker_threads';
import fs from 'fs';
import chalk from 'chalk';
import readline from 'readline';

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

// Function to display a countdown timer with a single line update
function startCountdown(durationInMilliseconds) {
  return new Promise((resolve) => {
    let remainingTime = durationInMilliseconds;

    // Create readline interface to overwrite the same line in the terminal
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const countdownInterval = setInterval(() => {
      const hours = Math.floor(remainingTime / (1000 * 60 * 60));
      const minutes = Math.floor(
        (remainingTime % (1000 * 60 * 60)) / (1000 * 60)
      );
      const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);

      // Overwrite the same line in the terminal
      readline.clearLine(process.stdout, 0);
      readline.cursorTo(process.stdout, 0);
      process.stdout.write(
        `⏳ Time remaining: ${hours}h ${minutes}m ${seconds}s`
      );

      if (remainingTime <= 0) {
        clearInterval(countdownInterval);
        rl.close(); // Close the readline interface

        // Clear the last countdown line and print the final message
        readline.clearLine(process.stdout, 0);
        readline.cursorTo(process.stdout, 0);
        console.log('\n⏳ Countdown finished! Running main again...');
        resolve();
      }

      remainingTime -= 1000; // Decrease by 1 second
    }, 1000); // Update every second
  });
}

async function runEveryXHours() {
  const xHours = 8;
  const xHoursInMilliseconds = xHours * 60 * 60 * 1000; // x hours in milliseconds

  while (true) {
    console.log('⏳ Starting execution of main...');
    await main(); // Run the main function

    console.log(`⏳ Waiting ${xHours} hours before running main again...`);
    await startCountdown(xHoursInMilliseconds); // Start countdown after main finishes
  }
}

runEveryXHours();
