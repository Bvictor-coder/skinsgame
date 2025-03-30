// Monarch Dunes Golf Course Data
const monarchDunesData = {
    name: "Monarch Dunes",
    tees: [
        {
            name: "Black",
            slope: 136,
            rating: 73.3,
            yards: [437, 200, 567, 423, 400, 255, 440, 490, 397, 453, 367, 141, 540, 140, 560, 350, 200, 470],
            totalYards: 6830
        },
        {
            name: "Gold",
            slope: 130, 
            rating: 71.0,
            yards: [407, 180, 550, 377, 370, 199, 350, 480, 387, 423, 357, 115, 530, 125, 550, 337, 177, 423],
            totalYards: 6337
        },
        {
            name: "Combo White/Gold",
            slope: 126,
            rating: 69.7,
            yards: [373, 180, 477, 377, 337, 199, 350, 460, 387, 360, 357, 115, 515, 125, 523, 337, 148, 423],
            totalYards: 6043
        },
        {
            name: "White",
            slope: 123,
            rating: 68.7,
            yards: [373, 140, 477, 347, 337, 184, 333, 460, 373, 360, 337, 103, 515, 117, 523, 307, 148, 387],
            totalYards: 5821
        },
        {
            name: "Bronze",
            slope: 117,
            rating: 66.5,
            yards: [343, 127, 457, 317, 300, 159, 303, 427, 327, 343, 303, 83, 467, 100, 477, 287, 137, 363],
            totalYards: 5320
        },
        {
            name: "Combo Bronze/Green",
            slope: 113,
            rating: 64.5,
            yards: [310, 127, 400, 297, 300, 115, 303, 387, 327, 303, 303, 83, 420, 100, 443, 287, 87, 363],
            totalYards: 4955
        },
        {
            name: "Green",
            slope: 110,
            rating: 63.1,
            yards: [310, 120, 400, 297, 273, 115, 270, 387, 290, 303, 256, 61, 420, 83, 443, 260, 87, 327],
            totalYards: 4702
        }
    ],
    par: [4, 3, 5, 4, 4, 3, 4, 5, 4, 4, 4, 3, 5, 3, 5, 4, 3, 4],
    totalPar: 71,
    hcp: {
        men: [1, 15, 9, 3, 7, 11, 13, 5, 17, 2, 14, 16, 4, 18, 8, 12, 10, 6],
        ladies: [1, 17, 7, 5, 11, 15, 9, 3, 13, 6, 12, 16, 2, 18, 4, 10, 14, 8]
    }
};

// Function to get the course data
function getMonarchDunesData() {
    return monarchDunesData;
}

// Function to calculate handicap strokes for a player on a specific hole
function calculateHandicapStrokes(playerHandicap, holeIndex, gender = 'men') {
    if (playerHandicap === null) return 0;
    
    const courseData = getMonarchDunesData();
    const holeHandicapIndex = courseData.hcp[gender][holeIndex - 1];
    
    // Calculate strokes for this hole based on handicap index
    // Using the "half pop" system (each stroke is worth 0.5)
    if (holeHandicapIndex <= Math.floor(playerHandicap)) {
        return 0.5; // Half pop
    }
    
    return 0;
}

// Export the functions
export { getMonarchDunesData, calculateHandicapStrokes };
