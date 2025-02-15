import readline from 'readline';

// Function to simulate the main task with a loop
async function main() {
  for (let i = 0; i < 10; i++) {
    console.log('🔁 Loop ' + i + ' of 10...');
    await delay(1000); // Simulate some delay between loops (optional)
  }
}

// Helper function to create a delay
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

// Main execution loop
async function runEvery12Hours() {
  const twelveHoursInMilliseconds = 60 * 60 * 1000; // 12 hours in milliseconds

  while (true) {
    console.log('⏳ Starting execution of main...');
    await main(); // Run the main function

    console.log('⏳ Waiting 12 hours before running main again...');
    await startCountdown(twelveHoursInMilliseconds); // Start countdown after main finishes
  }
}

runEvery12Hours();
