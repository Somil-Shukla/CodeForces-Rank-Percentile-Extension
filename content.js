window.addEventListener('load', () => {
    console.log('Extension loaded');

    // Find the user status element (e.g., Specialist, Expert, Master, etc.)
    const userStatusElement = document.querySelector('.user-rank');
    let statusColor = '#0073e6'; // Default to Specialist color

    // Find the rating element
    let ratingElement = null;
    const listItems = document.querySelectorAll('li'); // Select all `li` elements

    // Iterate over `li` elements to find the one that contains the text "Contest rating"
    listItems.forEach(item => {
        if (item.textContent.includes("Contest rating")) {
            ratingElement = item;
        }
    });

    if (!ratingElement) {
        console.log('Rating element not found');
        return;
    }

    const ratingText = ratingElement.querySelector('span[style*="font-weight:bold;"]').innerText.trim();
    console.log('Raw rating text:', ratingText);

    const userRating = parseInt(ratingText.match(/\d+/), 10);
    if (isNaN(userRating)) {
        console.log('Failed to parse user rating');
        return;
    }

    console.log('User rating found:', userRating);

    // Send a message to the background script to fetch the rank
    chrome.runtime.sendMessage({ action: 'fetchRank', userRating }, (response) => {
        console.log('Response received from background:', response);

        const rank = response.rank;
        if (rank) {
            const totalUsers = 900 * 200; // This should be the total number of users; update this dynamically if needed
            const percentile = (rank / totalUsers) * 100;
            console.log('Calculated percentile:', percentile);

            const statsItem = document.createElement('li');

            // Add the rank content with color coding based on status
            const rankContent = document.createElement('p');
            rankContent.innerHTML = `<strong>Global Rank:</strong> <span style="color: ${statusColor}">${rank}</span>`;
            rankContent.style.marginBottom = '0.5em';
            statsItem.appendChild(rankContent);

            // Add the percentile content with the same color coding
            const percentileContent = document.createElement('p');
            percentileContent.innerHTML = `<strong>Percentile:</strong> <span style="color: ${statusColor}">Top ${percentile.toFixed(2)}%</span>`;
            statsItem.appendChild(percentileContent);

            console.log('Inserting stats item before contest rating');

            // Insert the statsItem before the "Contest rating" field
            ratingElement.parentNode.insertBefore(statsItem, ratingElement);

            console.log('Stats item inserted successfully');
        } else {
            console.log('Rank not found in response');
        }
    });
});
