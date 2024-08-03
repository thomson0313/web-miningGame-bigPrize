document.addEventListener('DOMContentLoaded', function() {
    const gridSize = { columns: 6, visibleRows: 6 };
    const mineGrid = document.getElementById('mine-grid');
    const pickaxeButton = document.getElementById('pickaxe-button');
    const miniTntButton = document.getElementById('mini-tnt-button');
    const bigTntButton = document.getElementById('big-tnt-button');
    const pickaxeCountDisplay = document.getElementById('pickaxe-count');
    const miniTntCountDisplay = document.getElementById('mini-tnt-count');
    const bigTntCountDisplay = document.getElementById('big-tnt-count');
    const chest = document.getElementById('chest');
    const chestImage = document.getElementById('chest-image');
    const inventory = document.getElementById('inventory');
    const chestContent = document.getElementById('chest-content');

    let selectedTool = null;
    let pickaxeCount = 10;
    let miniTntCount = 10;
    let bigTntCount = 5;
    let oresCollected = { gold: 0, silver: 0, bronze: 0, azure: 0 };
    let rightmostColumnIndex = gridSize.columns - 1;

    const oreImages = {
        gold: 'images/goldoredrop.png',
        silver: 'images/silveroredrop.png',
        bronze: 'images/bronzeoredrop.png',
        azure: 'images/blue1.png'
    };

    const oreGIFs = {
        gold: 'images/goldoredrop.gif',
        silver: 'images/silveroredrop.gif',
        bronze: 'images/bronzeoredrop.gif',
        azure: 'images/aruzeoredrop.gif'
    };

    const dragImages = {
        pickaxe: 'images/pickaxe-large.png',
        miniTnt: 'images/mini-tnt-large.png',
        bigTnt: 'images/big-tnt-large.png'
    };

    // Toggle chest open/close
    chest.addEventListener('click', () => {
        if (inventory.style.display === 'none') {
            chestImage.src = 'images/openchest.png';
            inventory.style.display = 'block';
        } else {
            chestImage.src = 'images/chest1.png';
            inventory.style.display = 'none';
        }
    });

    pickaxeButton.addEventListener('dragstart', (e) => {
        selectedTool = 'pickaxe';
        e.dataTransfer.setData('text/plain', 'pickaxe');
        setCustomDragImage(e, dragImages.pickaxe);
    });

    miniTntButton.addEventListener('dragstart', (e) => {
        selectedTool = 'miniTnt';
        e.dataTransfer.setData('text/plain', 'miniTnt');
        setCustomDragImage(e, dragImages.miniTnt);
    });

    bigTntButton.addEventListener('dragstart', (e) => {
        selectedTool = 'bigTnt';
        e.dataTransfer.setData('text/plain', 'bigTnt');
        setCustomDragImage(e, dragImages.bigTnt);
    });

    function setCustomDragImage(e, imageUrl) {
        const img = new Image();
        img.src = imageUrl;
        img.onload = () => {
            e.dataTransfer.setDragImage(img, img.width / 2, img.height / 2);
        };
    }

    // Create the initial visible grid
    function createMineGrid() {
        for (let row = 0; row < gridSize.visibleRows; row++) {
            createRow();
        }
    }

    function createRow() {
        const row = document.createElement('div');
        row.classList.add('mine-row');
        for (let col = 0; col < gridSize.columns; col++) {
            const block = document.createElement('div');
            block.classList.add('mine-block');
            block.setAttribute('data-row', row);
            block.setAttribute('data-col', col);
            block.addEventListener('dragover', (e) => e.preventDefault());
            block.addEventListener('dragenter', highlightBlock);
            block.addEventListener('dragleave', unhighlightBlock);
            block.addEventListener('drop', handleDrop);
            assignBlockType(block);
            row.appendChild(block);
        }
        mineGrid.appendChild(row);
    }

    function assignBlockType(block) {
        const rand = Math.random();
        if (rand < 0.02) {  // 2% chance for Azure
            block.classList.add('azure-ore');
            block.setAttribute('data-type', 'azure');
            block.setAttribute('data-hits', '4'); // Azure ore might be tougher to mine
        } else if (rand < 0.05) {
            block.classList.add('gold-ore');
            block.setAttribute('data-type', 'gold');
            block.setAttribute('data-hits', '3');
        } else if (rand < 0.15) {
            block.classList.add('silver-ore');
            block.setAttribute('data-type', 'silver');
            block.setAttribute('data-hits', '2');
        } else if (rand < 0.30) {
            block.classList.add('bronze-ore');
            block.setAttribute('data-type', 'bronze');
            block.setAttribute('data-hits', '1');
        } else if (rand < 0.75) {
            block.classList.add('sand');
            block.setAttribute('data-type', 'sand');
            block.setAttribute('data-hits', '1');
        } else {
            block.classList.add('bedrock');
            block.setAttribute('data-type', 'bedrock');
        }
    }

    function highlightBlock(e) {
        if (selectedTool) {
            e.target.classList.add('highlight');
        }
    }

    function unhighlightBlock(e) {
        e.target.classList.remove('highlight');
    }

    function handleDrop(e) {
        e.preventDefault();
        e.target.classList.remove('highlight');
        const block = e.target;
        const blockType = block.getAttribute('data-type');
        const colIndex = parseInt(block.getAttribute('data-col'), 10);

        if (blockType === 'bedrock') return;

        if (selectedTool === 'pickaxe' && pickaxeCount > 0) {
            handlePickaxe(block);
        } else if (selectedTool === 'miniTnt' && miniTntCount > 0) {
            destroyRowWithCollision(block.parentElement, block);
            miniTntCount--;
            miniTntCountDisplay.textContent = miniTntCount;
        } else if (selectedTool === 'bigTnt' && bigTntCount > 0) {
            destroy3x3WithCollision(block);
            bigTntCount--;
            bigTntCountDisplay.textContent = bigTntCount;
        }

        // Check if the destroyed block is in the rightmost column
        if (colIndex === rightmostColumnIndex) {
            shiftGridLeftAndGenerateNewRightColumn();
        }
    }

    function handlePickaxe(block) {
        const blockHits = parseInt(block.getAttribute('data-hits'), 10);
    
        // Trigger the animation for the pickaxe regardless of the block type
        animatePickaxe(block);
    
        // Check if the block has hits left
        if (blockHits > 1) {
            block.setAttribute('data-hits', blockHits - 1);
        } else {
            const blockType = block.getAttribute('data-type');
            
            // Handle sand block separately
            if (blockType === 'sand') {
                createDustParticles(block);
                block.style.visibility = 'hidden'; // Hide the block after dust particles
            } else {
                // For ores, play the GIF animation
                playOreAnimation(block, blockType);
            }
        }
        
        // Decrease the pickaxe count and update the display
        pickaxeCount--;
        pickaxeCountDisplay.textContent = pickaxeCount;
    }
        

    function playOreAnimation(block, blockType) {
        const oreGif = oreGIFs[blockType];
        block.style.backgroundImage = `url('${oreGif}')`;
    
        // Assuming the GIF animation duration is 2 seconds (adjust as necessary)
        setTimeout(() => {
            block.style.visibility = 'hidden';
            collectBlock(block, blockType); // Collect the block after the animation
        }, 2000); // Adjust based on the duration of your GIF
    }
    

    function animatePickaxe(block) {
        const pickaxeImage = document.createElement('img');
        pickaxeImage.src = 'images/pickaxe1.png'; // Use the correct path to your pickaxe image
        pickaxeImage.classList.add('pickaxe-animation');
        block.appendChild(pickaxeImage);
    
        // Remove the pickaxe image after the animation
        setTimeout(() => {
            pickaxeImage.remove();
        }, 300);
    }

    function createDustParticles(block) {
        for (let i = 0; i < 10; i++) { // Generate 10 particles
            const particle = document.createElement('div');
            particle.classList.add('dust-particle');
            particle.style.left = `${Math.random() * 50}px`; // Random position within block
            particle.style.top = `${Math.random() * 50}px`;
            block.appendChild(particle);
    
            // Remove the particle after the animation
            setTimeout(() => {
                particle.remove();
            }, 500);
        }
    }

    function destroyRowWithCollision(row, centerBlock) {
        const centerColIndex = Array.from(centerBlock.parentElement.children).indexOf(centerBlock);
        const centerRowIndex = Array.from(mineGrid.children).indexOf(row);

        // Destroy above the center block
        for (let i = centerRowIndex - 1; i >= 0; i--) {
            const block = mineGrid.children[i].children[centerColIndex];
            if (block.getAttribute('data-type') === 'bedrock') break; // Stop if bedrock
            destroyBlock(block);
        }

        // Destroy below the center block
        for (let i = centerRowIndex + 1; i < mineGrid.children.length; i++) {
            const block = mineGrid.children[i].children[centerColIndex];
            if (block.getAttribute('data-type') === 'bedrock') break; // Stop if bedrock
            destroyBlock(block);
        }

        // Destroy the center block itself
        destroyBlock(centerBlock);
    }

    function destroy3x3WithCollision(centerBlock) {
        const centerCol = Array.from(centerBlock.parentElement.children).indexOf(centerBlock);
        const centerRow = Array.from(mineGrid.children).indexOf(centerBlock.parentElement);

        for (let r = centerRow - 1; r <= centerRow + 1; r++) {
            if (r < 0 || r >= mineGrid.children.length) continue;

            for (let c = centerCol - 1; c <= centerCol + 1; c++) {
                if (c < 0 || c >= gridSize.columns) continue;

                const block = mineGrid.children[r].children[c];
                const blockType = block.getAttribute('data-type');

                if (blockType === 'bedrock') continue;

                destroyBlock(block);
            }
        }
    }

    function destroyBlock(block) {
        const blockType = block.getAttribute('data-type');
        if (blockType !== 'bedrock') {
            // Play the GIF animation for TNT destruction
            playOreAnimation(block, blockType);
        }
    }

    function collectBlock(block, blockType) {
        oresCollected[blockType]++;
        updateChestContent();
    }

    function updateChestContent() {
        chestContent.innerHTML = '';
        for (let ore in oresCollected) {
            if (oresCollected[ore] > 0) {
                const listItem = document.createElement('li');
                listItem.textContent = `${ore.charAt(0).toUpperCase() + ore.slice(1)} x ${oresCollected[ore]}`;
                chestContent.appendChild(listItem);
            }
        }
    }

    function shiftGridLeftAndGenerateNewRightColumn() {
        // Remove the first column from each row (shifting left)
        mineGrid.querySelectorAll('.mine-row').forEach(row => {
            row.removeChild(row.firstElementChild);
        });

        // Add a new column on the right side
        mineGrid.querySelectorAll('.mine-row').forEach((row, rowIndex) => {
            const newBlock = document.createElement('div');
            newBlock.classList.add('mine-block');
            newBlock.setAttribute('data-row', rowIndex);
            newBlock.setAttribute('data-col', gridSize.columns - 1);
            newBlock.addEventListener('dragover', (e) => e.preventDefault());
            newBlock.addEventListener('dragenter', highlightBlock);
            newBlock.addEventListener('dragleave', unhighlightBlock);
            newBlock.addEventListener('drop', handleDrop);
            assignBlockType(newBlock);
            row.appendChild(newBlock);
        });

        // Reset the rightmost column index
        rightmostColumnIndex = gridSize.columns - 1;
    }

    createMineGrid();
});
