// We import the 'promises' version of the file system module
const fs = require('fs').promises; 
const path = require('path');

async function readFiveFiles() {
    // 1. Define the paths to your 5 large files
    const filePaths = [
        path.join(__dirname, 'file1.txt'),
        path.join(__dirname, 'file2.txt'),
        path.join(__dirname, 'file3.txt'),
        path.join(__dirname, 'file4.txt'),
        path.join(__dirname, 'file5.txt')
    ];

    try {
		// --- STEP 1: CREATE THE FILES ---
        console.log("📝 Generating the 5 text files simultaneously...");
        
        // Map each path to a writeFile promise execution
        const fileWritePromises = filePaths.map((filePath, index) => {
            const dummyContent = `This is the placeholder content inside file number ${index + 1}!`;
            return fs.writeFile(filePath, dummyContent, 'utf-8');
        });

        // Wait until all 5 files are successfully written to your 'public' disk folder
        await Promise.all(fileWritePromises);
        console.log("✨ Files successfully created!");
		
        console.log("⏳ Starting to read all 5 files simultaneously...");

        // 2. Map the paths into an array of Promises.
        // Notice there is NO 'await' inside this map. 
        // This kicks off all 5 read operations at the exact same moment.
        const fileReadPromises = filePaths.map(filePath => {
            return fs.readFile(filePath, 'utf-8');
        });

        // 3. Pause THIS function until all promises in the array resolve.
        // The OS reads them concurrently in the background.
        const allFileContents = await Promise.all(fileReadPromises);

        console.log("✅ All files finished reading successfully!");
        
        // 'allFileContents' is now an array containing the text of each file in order
        allFileContents.forEach((content, index) => {
            console.log(`--- Contents of File ${index + 1} (First 100 chars) ---`);
            console.log(content.substring(0, 100) + "...\n");
        });

    } catch (error) {
        // If even ONE file fails to read (e.g., misspelled name), Promise.all fails immediately
        console.error("❌ An error occurred while reading the files:", error);
    }
}

// --- Proof that it is non-blocking ---

// We call our async function...
readFiveFiles();

// ...and immediately log this message. 
// This will print BEFORE the files finish reading, proving the loop isn't blocked!
console.log("🚀 Look! I executed instantly while the files are still loading in the background!");