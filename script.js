document.addEventListener('DOMContentLoaded', function() {
    const gridSize = { columns: 6, visibleRows: 7 };
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
    let pickaxeCount = 50;
    let miniTntCount = 50;
    let bigTntCount = 20;
    let oresCollected = { gold: 0, silver: 0, bronze: 0, azure: 0 };
    let depth = 0;
    let backgroundPosition = 0;
    let rightmostColumnIndex = depth + 5;
    let lastAddedRowIndex = null; // Track the index of the last added row

    const oreGIFs = {
        gold: 'images/goldoredrop.gif',
        silver: 'images/silveroredrop.gif',
        bronze: 'images/bronzeoredrop.gif',
        azure: 'images/aruzeoredrop.gif'
    };

    const tntGIFs = {
        miniTnt: 'images/mini-tnt1.png',
        bigTnt: 'images/big-tnt2.gif',
        miniTntExplode: 'images/mini-tnt1.gif',
        bigTntExplode: 'images/mini-tnt1.gif'
    };

    const dragImages = {
        pickaxe: 'images/2.png',
        miniTnt: 'images/mini-tnt1.png',
        bigTnt: 'images/big-tnt2.png'
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

    function createMineGrid() {
        for (let row = 0; row < gridSize.visibleRows; row++) {
            createRow();
        }
    }

    function createRow() {
        const row = document.createElement('div');
        row.classList.add('mine-row');
        row.setAttribute('data-row-index', mineGrid.children.length); // Set row index attribute

        for (let col = 0; col < gridSize.columns; col++) {
            const block = document.createElement('div');
            block.classList.add('mine-block');
            block.setAttribute('data-row', row.getAttribute('data-row-index'));
            block.setAttribute('data-col', col);
            block.addEventListener('dragover', (e) => e.preventDefault());
            block.addEventListener('dragenter', handleDragEnter);
            block.addEventListener('dragleave', handleDragLeave);
            block.addEventListener('drop', handleDrop);
            assignBlockType(block);
            row.appendChild(block);
        }
        mineGrid.appendChild(row);
    }

    function assignBlockType(block) {
        const rand = Math.random();
        if (rand < 0.35) {  // 35% chance for empty (void) block
            block.classList.add('empty');
            block.setAttribute('data-type', 'empty');
        } else if (rand < 0.38) {  // 3% chance for Azure ore
            block.classList.add('azure');
            block.setAttribute('data-type', 'azure');
            block.setAttribute('data-hits', '4');
        } else if (rand < 0.41) {  // 3% chance for Gold ore
            block.classList.add('gold');
            block.setAttribute('data-type', 'gold');
            block.setAttribute('data-hits', '3');
        } else if (rand < 0.45) {  // 4% chance for Silver ore
            block.classList.add('silver');
            block.setAttribute('data-type', 'silver');
            block.setAttribute('data-hits', '2');
        } else if (rand < 0.50) {  // 5% chance for Bronze ore
            block.classList.add('bronze');
            block.setAttribute('data-type', 'bronze');
            block.setAttribute('data-hits', '1');
        } else if (rand < 0.85) {  // 30% chance for Sand
            block.classList.add('sand');
            block.setAttribute('data-type', 'sand');
            block.setAttribute('data-hits', '1');
        } else {  // 15% chance for Bedrock
            block.classList.add('bedrock');
            block.setAttribute('data-type', 'bedrock');
        }
    }

    function assignLastRowBlockType(block) {
        const rand = Math.random();
        if (rand < 0.1) {  // 10% chance for empty (void) block
            block.classList.add('sand');
            block.setAttribute('data-type', 'sand');
        } else if(rand < 0.15) {  // 5% chance for empty
            block.classList.add('empty');
            block.setAttribute('data-type', 'empty');
        } else {  // 85% chance for Bedrock
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

    function handleDragEnter(e) {
        const block = e.target;
        if (selectedTool === 'miniTnt' || selectedTool === 'bigTnt') {
            highlightExplosionArea(block);
        } else {
            highlightBlock(e);
        }
    }

    function handleDragLeave(e) {
        if (selectedTool === 'miniTnt' || selectedTool === 'bigTnt') {
            removeExplosionAreaHighlight();
        } else {
            unhighlightBlock(e);
        }
    }


    function handleDrop(e) {
        e.preventDefault();
        removeExplosionAreaHighlight();
        e.target.classList.remove('highlight');
        const block = e.target;
        const blockType = block.getAttribute('data-type');
        const colIndex = parseInt(block.getAttribute('data-col'), 10);
        const rowIndex = parseInt(block.getAttribute('data-row'), 10);
    
        // Instrumens is restricted to bedrock and Restrict TNT placement to empty blocks and last row 
        // if (((blockType !== 'empty') && (selectedTool === 'miniTnt' || selectedTool === 'bigTnt'))) return;
    
        if(selectedTool === 'miniTnt' || selectedTool === 'bigTnt') {
            if(blockType !== 'empty') {
                alert('A Dynamite or a bomb can be placed at void area...')
            }

            if (colIndex === rightmostColumnIndex) {
                let generatable = 1;
                const row = Array.from(mineGrid.children);
                for (let r = 0; r < row.length; r++) {
                    const col = Array.from(row[r].children);
                    if(depth === 0) {
                        for (let c = 0; c < col.length - 1; c++) {
                            const dataType = col[c].getAttribute('data-type');
                            if(dataType !== 'sand' && dataType !== 'bedrock' && dataType !== 'empty') {
                                generatable = 0;
                            }
                        }
                    } else {
                        for (let c = 1; c < col.length; c++) {
                            const dataType = col[c].getAttribute('data-type');
                            if(dataType !== 'sand' && dataType !== 'bedrock' && dataType !== 'empty') {
                                generatable = 0;
                            }
                        }
                    }
                }
                if(generatable === 0) {
                    alert('There are still metals to dig...')
                    return;
                }
                setTimeout(() => {
                    shiftGridLeftAndGenerateNewRightColumn();
                }, 3000)
            }
        }

        if (selectedTool === 'pickaxe' && pickaxeCount > 0) {
            // handle drop on last row
            if (colIndex === rightmostColumnIndex) {
                let generatable = 1;
                const row = Array.from(mineGrid.children);
                for (let r = 0; r < row.length; r++) {
                    const col = Array.from(row[r].children);
                    if(depth === 0) {
                        for (let c = 0; c < col.length - 1; c++) {
                            const dataType = col[c].getAttribute('data-type');
                            if(dataType !== 'sand' && dataType !== 'bedrock' && dataType !== 'empty') {
                                generatable = 0;
                            }
                        }
                    } else {
                        for (let c = 1; c < col.length; c++) {
                            const dataType = col[c].getAttribute('data-type');
                            if(dataType !== 'sand' && dataType !== 'bedrock' && dataType !== 'empty') {
                                generatable = 0;
                            }
                        }
                    }
                }
                if(generatable === 0) {
                    alert('There are still metals to dig...')
                    return;
                } 
                handlePickaxe(block);
                shiftGridLeftAndGenerateNewRightColumn();
            }
            handlePickaxe(block);

        } else if (selectedTool === 'miniTnt' && miniTntCount > 0) {
            placeAndExplodeTNT(block, 'miniTnt');
            miniTntCount--;
            miniTntCountDisplay.textContent = miniTntCount;
        } else if (selectedTool === 'bigTnt' && bigTntCount > 0) {
            placeAndExplodeTNT(block, 'bigTnt');
            bigTntCount--;
            bigTntCountDisplay.textContent = bigTntCount;
        }
    }
    
    function placeAndExplodeTNT(block, tntType) {
        const tntImage = document.createElement('img');
        tntImage.src = tntGIFs[tntType];
        tntImage.classList.add('tnt-animation');
        block.appendChild(tntImage);

        setTimeout(() => {
            tntImage.src = tntGIFs[tntType + 'Explode'];
            setTimeout(() => {
                tntImage.remove();
                if (tntType === 'miniTnt') {
                    destroyRowWithCollision(block.parentElement, block);
                } else if (tntType === 'bigTnt') {
                    destroy3x3WithCollision(block);
                }
            }, 1000); // Duration of explosion GIF
        }, 1500); // Delay before TNT explodes
    }

    function highlightExplosionArea(block) {
        const col = Array.from(block.parentElement.children).indexOf(block);
        const row = Array.from(mineGrid.children).indexOf(block.parentElement);

        let blocksToHighlight = [];

        if (selectedTool === 'miniTnt') {
            for (let i = 0; i < mineGrid.children.length; i++) {
                const colBlock = mineGrid.children[i].children[col];
                blocksToHighlight.push(colBlock);
            }
        } else if (selectedTool === 'bigTnt') {
            for (let r = row - 1; r <= row + 1; r++) {
                if (r < 0 || r >= gridSize.visibleRows) continue;

                for (let c = col - 1; c <= col + 1; c++) {
                    if (c < 0 || c >= gridSize.columns) continue;

                    const gridBlock = mineGrid.children[r].children[c];
                    blocksToHighlight.push(gridBlock);
                }
            }
        }

        blocksToHighlight.forEach(block => {
            block.classList.add('explosion-highlight');
        });
    }

    function removeExplosionAreaHighlight() {
        mineGrid.querySelectorAll('.explosion-highlight').forEach(block => {
            block.classList.remove('explosion-highlight');
        });
    }

    function handlePickaxe(block) {
        const blockHits = parseInt(block.getAttribute('data-hits'), 10);
        const blockType = block.getAttribute('data-type');
        
        
        if (blockHits > 1) {
            animatePickaxe(block);
            block.setAttribute('data-hits', blockHits - 1);
        } else {
            if(blockType === 'empty') {
                return;
            } else {
                animatePickaxe(block);
                if (blockType === 'sand') {
                    createDustParticles(block);
                    setTimeout(() => {
                        // block.style.visibility = 'hidden';
                        block.setAttribute('data-type', 'empty')
                        block.classList.remove('sand');
                        block.classList.add('empty');
                    }, 500)
                } else {
                    playOreAnimation(block, blockType);
                }
            }
        }
    
        pickaxeCount--;
        pickaxeCountDisplay.textContent = pickaxeCount;
    }

    function playOreAnimation(block, blockType) {
        setTimeout(() => {
            const oreGif = oreGIFs[blockType];
            block.style.backgroundImage = `url('${oreGif}')`;
            setTimeout(() => {
                block.style.backgroundImage = '';
                block.setAttribute('data-type', 'empty')
                block.classList.remove(blockType);
                block.classList.add('empty');
                collectBlock(block, blockType);
            }, 300)
        }, 800);
    }

    function animatePickaxe(block) {
        const pickaxeImage = document.createElement('img');
        pickaxeImage.src = 'images/pickaxe1.png';
        pickaxeImage.classList.add('pickaxe-animation');
        block.appendChild(pickaxeImage);
    
        setTimeout(() => {
            pickaxeImage.remove();
        }, 500);
    }

    function createDustParticles(block) {
        for (let i = 0; i < 10; i++) {
            const particle = document.createElement('div');
            particle.classList.add('dust-particle');
            particle.style.left = `${Math.random() * 50}px`;
            particle.style.top = `${Math.random() * 50}px`;
            block.appendChild(particle);
    
            setTimeout(() => {
                particle.remove();
            }, 500);
        }
    }

    function destroyRowWithCollision(row, centerBlock) {
        const centerColIndex = Array.from(centerBlock.parentElement.children).indexOf(centerBlock);
        const centerRowIndex = Array.from(mineGrid.children).indexOf(row);

        for (let i = centerRowIndex - 1; i >= 0; i--) {
            const block = mineGrid.children[i].children[centerColIndex];
            // if (block.getAttribute('data-type') === 'bedrock') break;
            destroyBlock(block);
        }

        for (let i = centerRowIndex + 1; i < mineGrid.children.length; i++) {
            const block = mineGrid.children[i].children[centerColIndex];
            // if (block.getAttribute('data-type') === 'bedrock') break;
            destroyBlock(block);
        }
    }

    function destroy3x3WithCollision(centerBlock) {
        const centerCol = Array.from(centerBlock.parentElement.children).indexOf(centerBlock);
        const centerRow = Array.from(mineGrid.children).indexOf(centerBlock.parentElement);

        for (let r = centerRow - 1; r <= centerRow + 1; r++) {
            if (r < 0 || r >= mineGrid.children.length) continue;

            for (let c = centerCol - 1; c <= centerCol + 1; c++) {
                if (c < 0 || c >= gridSize.columns) continue;

                const block = mineGrid.children[r].children[c];
                // const blockType = block.getAttribute('data-type');

                // if (blockType === 'bedrock') continue;

                destroyBlock(block);
            }
        }
    }
    function destroyBlock(block) {
        const blockType = block.getAttribute('data-type');
        console.log(blockType)
        createParticles(block); // Create particles when block is destroyed
        playOreAnimation(block, blockType);
        
        setTimeout(() => {
            block.style.backgroundImage = ''; // Remove the ore's background image
            block.classList.remove(blockType);
            block.classList.add('empty');
            block.setAttribute('data-type', 'empty'); // Set the block type to 'empty'
            block.style.visibility = 'visible'; // Ensure the block is visible as an empty block
        }, 300); // Match this duration with the ore animation duration
    }
    
    
    
    
    function createParticles(block) {
        const particleCount = 10; // Number of particles to generate
        const blockRect = block.getBoundingClientRect();
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.classList.add('particle');
            particle.style.left = `${Math.random() * blockRect.width}px`; // Random position within block
            particle.style.top = `${Math.random() * blockRect.height}px`;
            particle.style.backgroundColor = getBlockParticleColor(block.getAttribute('data-type')); // Set particle color based on block type
            block.appendChild(particle);
            
            setTimeout(() => {
                particle.remove(); // Remove particle after animation
            }, 1000); // Duration of particle animation
        }
    }
    function getBlockParticleColor(blockType) {
        switch (blockType) {
            case 'gold':
                return '#FFD700'; // Gold color
            case 'silver':
                return '#C0C0C0'; // Silver color
            case 'bronze':
                return '#CD7F32'; // Bronze color
            case 'azure':
                return '#007FFF'; // Azure color
            case 'sand':
                return '#f4a460'; // Sand color
            default:
                return '#fff'; // Default white color
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
    

    function updateDepthCounter(newDepth) {
        const depthCounter = document.getElementById('depth-counter');
        const currentDepth = parseInt(depthCounter.textContent.replace('Depth: ', ''), 10);
        const increment = newDepth > currentDepth ? 1 : -1;
        const duration = 500; // Total animation duration in ms
        const steps = Math.abs(newDepth - currentDepth);
        const stepTime = duration / steps; // Time per increment

        let counter = currentDepth;

        const timer = setInterval(() => {
            counter += increment;
            depthCounter.textContent = `Depth: ${counter}`;
            if (counter === newDepth) {
                clearInterval(timer);
            }
        }, stepTime);
    }


    function isLastRowValid() {

        const lastRow = mineGrid.children[mineGrid.children.length - 2];
        const blocks = lastRow.children;
    
        for (let block of blocks) {
            const blockType = block.getAttribute('data-type');
            // Check if the block is not bedrock and not empty
            if (blockType !== 'bedrock' && blockType !== 'empty' && blockType !== 'sand') {
                return true; // A valid row was found
            }
        }
        return false; // Row is invalid (full of bedrock or empty blocks)
    }

    function shiftGridLeftAndGenerateNewRightColumn() {

        // Increment background position
        backgroundPosition += 60; // Adjust based on your block height
    
        // Apply shaking effect to the whole grid before shifting
        mineGrid.classList.add('shake-animation');
        let slidable = true;
        
        setTimeout(() => {
            // Remove shaking effect before shifting starts
            mineGrid.classList.remove('shake-animation');
    
            // Move the background and shift the grid simultaneously
            mineGrid.style.backgroundPositionY = `-${backgroundPosition}px`;
            mineGrid.classList.add('shift-left');
    
            // Apply fade-out effect to the leftmost column blocks one by one
            mineGrid.querySelectorAll('.mine-row').forEach((row, rowIndex) => {
                const firstBlock = row.firstElementChild;
                setTimeout(() => {
                    firstBlock.classList.add('fade-out');
                    setTimeout(() => {
                        row.removeChild(firstBlock); // Remove the block after the fade-out animation completes
                    }, 300); // Match this duration with the fade-out animation
                },  900); // 250ms delay between each block's fade-out
            });
    
            setTimeout(() => {

                // Slowly add the new right column with a glow effect
                mineGrid.querySelectorAll('.mine-row').forEach( async (row, rowIndex) => {
                    // const newBlock = null;
                    const newBlock = document.createElement('div');
                    newBlock.classList.add('mine-block', 'glow');
                    newBlock.setAttribute('data-row', rowIndex);
                    newBlock.setAttribute('data-col', depth+6);
                    newBlock.addEventListener('dragover', (e) => e.preventDefault());
                    newBlock.addEventListener('dragenter', handleDragEnter);
                    newBlock.addEventListener('dragleave', handleDragLeave);
                    newBlock.addEventListener('drop', handleDrop);
                    assignLastRowBlockType(newBlock); 

                    const lastBlock = row.lastChild;
                    lastBlock.classList.remove(lastBlock.getAttribute('data-type'));
                    assignBlockType(lastBlock);

                    const lastBlockType = lastBlock.getAttribute('data-type');

                    if(lastBlockType !== 'bedrock' && lastBlockType !== 'empty' && lastBlockType !== 'sand') {
                        slidable = false;
                    }

                    // Add a slight delay for each block to create a staggered effect
                    setTimeout( () => {
                       row.appendChild(newBlock);
                        
                        
                        // Remove the glow effect after some time
                        setTimeout(() => {
                            newBlock.classList.remove('glow');
                        }, 300); // Glow duration
                    }, 600); // 250ms delay between each row's new block addition


                });

                // Increment the depth counter for each block added
                depth++;
                updateDepthCounter(depth); // Use the animated counter function

                rightmostColumnIndex = depth + 5;
                lastAddedRowIndex = mineGrid.children.length - 1; // Track the index of the last added row
                mineGrid.classList.remove('shift-left');
                
    
                if (!slidable) return;

                setTimeout(() => {
                    shiftGridLeftAndGenerateNewRightColumn();                    
                }, 1000);
                
            }, 350); // Duration of the shift-left animation
    
    
        }, 600); // Duration of the shaking effect
    }

    
    createMineGrid();
});
