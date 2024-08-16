async function fetchRankData(userRating) {
    let lo = 1;
    let hi = 900; // Total number of pages (adjust if necessary)
   
    // Ensure userRating is an integer
    userRating = parseInt(userRating, 10);
    if (isNaN(userRating)) {
      console.error('Invalid user rating:', userRating);
      return null;
    }
   
    console.log(`Starting binary search for user rating: ${userRating}`);
   
    while (lo <= hi) {
        const mid = Math.floor((lo + hi) / 2);
        const url = `https://codeforces.com/ratings/page/${mid}`;

        console.log(`Fetching data from: ${url}`);
        
        try {
            const response = await fetch(url);
            const text = await response.text();
            console.log(`Page ${mid} fetched successfully.`);
                
            // Extract the relevant table by identifying its structure
            const relevantTable = text.split('<table class="">')[1];
            // console.log(relevantTable);
            if (!relevantTable) {
                console.log(`Relevant table not found on page ${mid}. Skipping...`);
                continue;
            }

            // Extract rows from the relevant table, starting from the 2nd row (after the header)
            const rows = relevantTable.split('<tr').slice(2).map((row) => {
                // Split the row into columns using <td> as a delimiter
                const columns = row.split('<td').slice(1);
            
                // Extract rank from the first column
                const rankMatch = columns[0]?.match(/>\s*(\d+)\s*<\/td>/);
                const rank = rankMatch ? parseInt(rankMatch[1], 10) : null;
            
                // Extract rating from the last column (4th <td> in the row)
                const ratingMatch = columns[3]?.match(/>\s*(\d+)\s*<\/td>/);
                const rating = ratingMatch ? parseInt(ratingMatch[1], 10) : null;
            
                return { rank, rating };
            });
            
            // Log the parsed rows to verify the output
            console.log(rows);
   
            // Filter out rows where rank or rating couldn't be parsed properly
            const validRows = rows.filter((row) => row.rank !== null && row.rating !== null);
            if (validRows.length === 0) {
                console.log(`No valid rows found in the relevant table on page ${mid}. Skipping...`);
                continue;
            }
   
            const minRating = validRows[validRows.length - 1].rating;
            const maxRating = validRows[0].rating;
   
            console.log(`Page ${mid} ratings: Min = ${minRating}, Max = ${maxRating}`);
   
            if (userRating >= minRating && userRating <= maxRating) {
                console.log(`User rating ${userRating} is within range on page ${mid}.`);
   
                // Find the exact row with the user's rating
                for (const row of validRows) {
                    if (row.rating === userRating) {
                        console.log(`Exact match found: Rank = ${row.rank}`);
                        return row.rank;
                    }
                }
   
                console.log(`User rating ${userRating} not found on page ${mid} after filtering.`);
            } else if (userRating < minRating) {
                console.log(`User rating ${userRating} is less than min rating ${minRating} on page ${mid}. Moving to lower half.`);
                
                lo = Math.floor(mid + 1);
            } else {
                console.log(`User rating ${userRating} is greater than max rating ${maxRating} on page ${mid}. Moving to upper half.`);
                hi = Math.floor(mid - 1);
            }
        } catch (error) {
            console.error(`Error fetching or processing page ${mid}:`, error);
        }

        // Delay of 5 seconds before the next iteration
        await new Promise(resolve => setTimeout(resolve, 100));
    }
   
    console.log(`User rating ${userRating} not found within search range.`);
    return null;
}
   
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'fetchRank') {
        console.log(`Received fetchRank request with userRating: ${request.userRating}`);
        fetchRankData(request.userRating)
            .then(rank => {
                console.log(`Returning rank: ${rank}`);
                sendResponse({ rank });
            })
            .catch(error => {
                console.error('Error fetching rank:', error);
                sendResponse({ error: error.message });
            });
        return true; // Keep the message channel open for async response
    }
});
