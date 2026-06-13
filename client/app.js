document.addEventListener('DOMContentLoaded', () => {

    const itemsContainer = document.getElementById('items-container');
    const categoryBtns = document.querySelectorAll('.category-btn');
    const loadMoreBtn = document.getElementById('load-more-btn');
    const searchInput = document.querySelector('.search-bar input');

    let allCurrentItems = [];
    let filteredItems = [];
    let currentItemIndex = 0;
    const ITEMS_PER_PAGE = 50;
    let currentCategory = 'weapon';

    let allSets = [];
    let allRecipes = [];
    let itemsDictionary = {};
    let globalItemsList = [];
    let detailedItemsMap = {};

    // ==========================================
    // --- SPA: ПЕРЕМИКАННЯ В'ЮШОК ---
    // ==========================================
    const navTabs = document.querySelectorAll('.nav-tabs button');
    const catalogView = document.getElementById('catalog-view');
    const craftingView = document.getElementById('crafting-view');

    navTabs.forEach((tab, index) => {
        tab.addEventListener('click', () => {
            navTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            if (catalogView && craftingView) {
                if (index === 0) {
                    catalogView.style.display = 'flex';
                    craftingView.style.display = 'none';
                } else if (index === 1) {
                    catalogView.style.display = 'none';
                    craftingView.style.display = 'flex';
                }
            }
        });
    });
    // ==========================================
    // --- ГЛОБАЛЬНЕ ЗАВАНТАЖЕННЯ ДАНИХ ---
    // ==========================================
    async function fetchGlobalData() {
        try {
            const timestamp = new Date().getTime();
            const [setsRes, recipesRes, itemsRes, armorRes, accRes] = await Promise.all([
                fetch(`http://localhost:3000/data/id_references/set.json?v=${timestamp}`).catch(() => null),
                fetch(`http://localhost:3000/data/id_references/recipes.json?v=${timestamp}`).catch(() => null),
                fetch(`http://localhost:3000/data/id_references/items.json?v=${timestamp}`).catch(() => null),
                fetch(`http://localhost:3000/api/items/armor?v=${timestamp}`).catch(() => null),
                fetch(`http://localhost:3000/api/items/accessory?v=${timestamp}`).catch(() => null)
            ]);

            if (setsRes && setsRes.ok) allSets = await setsRes.json();
            if (recipesRes && recipesRes.ok) allRecipes = await recipesRes.json();

            if (itemsRes && itemsRes.ok) {
                const itemsData = await itemsRes.json();
                if (Array.isArray(itemsData)) {
                    globalItemsList = itemsData;
                    itemsData.forEach(item => {
                        const rawId = item["Item ID"] || item["ID"] || item["id"];
                        let rawName = item["Name"] || item["name"];
                        if (rawId !== undefined && rawName !== undefined) {
                            const id = String(rawId).trim();
                            let name = String(rawName).trim().replace(/\(item\)/gi, '').trim();
                            itemsDictionary[id] = name;
                        }
                    });
                }
            }


            if (armorRes && armorRes.ok) {
                const armorData = await armorRes.json();
                armorData.forEach(item => {
                    if (item["Name"]) {
                        const cleanName = String(item["Name"]).trim().toLowerCase();
                        detailedItemsMap[cleanName] = {
                            category: 'armor',
                            defense: parseInt(item["Defense"]) || 0,
                            tooltip: item["Tooltip"] || ""
                        };
                    }
                });
            }


            if (accRes && accRes.ok) {
                const accData = await accRes.json();
                accData.forEach(item => {
                    if (item["Name"]) {
                        const cleanName = String(item["Name"]).trim().toLowerCase();
                        detailedItemsMap[cleanName] = {
                            category: 'accessory',
                            defense: parseInt(item["Defense"]) || 0,
                            tooltip: item["Tooltip"] || ""
                        };
                    }
                });
            }
        } catch (error) {
            console.error('Error occurred while loading global data:', error);
        }


        updateAccessorySlots();
        loadBuildState();
        updateBuildSummary();
    }
    fetchGlobalData();

    // ==========================================
    // --- ЛОГІКА ДОВІДНИКА ПРЕДМЕТІВ ---
    // ==========================================
    async function fetchItems(category) {
        try {
            if (!itemsContainer) return;
            itemsContainer.innerHTML = '<p style="text-align:center; width:100%; padding-top: 20px;">Завантаження з бази...</p>';
            if (loadMoreBtn) loadMoreBtn.style.display = 'none';

            let apiCategory = category;
            if (category === 'material') apiCategory = 'crafting_material';

            const response = await fetch(`http://localhost:3000/api/items/${apiCategory}`);
            if (!response.ok) throw new Error(`Error: ${response.status}`);

            const items = await response.json();
            allCurrentItems = items;
            filteredItems = [...allCurrentItems];
            if (searchInput) searchInput.value = '';

            currentItemIndex = 0;
            itemsContainer.innerHTML = '';
            renderMoreItems();
        } catch (error) {
            console.error('Error:', error);
            if (itemsContainer) itemsContainer.innerHTML = '<p style="text-align:center; color: #ff6b6b; width:100%;">Failed to find category in the database.</p>';
        }
    }

    function renderMoreItems() {
        if (!itemsContainer) return;
        const itemsToRender = filteredItems.slice(currentItemIndex, currentItemIndex + ITEMS_PER_PAGE);

        itemsToRender.forEach(item => {
            const card = document.createElement('div');
            card.className = 'item-card';

            const name = item["Name"] || "Невідомо";
            const damage = item["Damage"] ? `<div>⚔️ ${item["Damage"]}</div>` : '';
            const defense = item["Defense"] ? `<div>🛡️ ${item["Defense"]} Defense</div>` : '';

            const imageName = name.replace(/ /g, '_');
            const imageSrc = `http://localhost:3000/data/img_sprites/${imageName}.png`;

            card.setAttribute('draggable', 'true');

            card.addEventListener('dragstart', (e) => {
                const defValue = item["Defense"] ? parseInt(item["Defense"]) : 0;
                const tooltipText = item["Tooltip"] || "";
                const itemData = {
                    name, imageSrc, category: currentCategory, defense: defValue, tooltip: tooltipText
                };
                e.dataTransfer.setData('application/json', JSON.stringify(itemData));
                e.dataTransfer.effectAllowed = 'copy';
            });

            card.addEventListener('click', () => {
                openItemModal(item);
            });

            card.innerHTML = `
                <div class="item-icon-box">
                    <img src="${imageSrc}" alt="${name}" style="max-width: 40px; max-height: 40px;" onerror="this.style.display='none'">
                </div>
                <div class="item-title">${name}</div>
                <div class="item-stats">
                    ${damage}
                    ${defense}
                </div>
            `;
            itemsContainer.appendChild(card);
        });

        currentItemIndex += ITEMS_PER_PAGE;

        if (loadMoreBtn) {
            if (currentItemIndex >= filteredItems.length) {
                loadMoreBtn.style.display = 'none';
            } else {
                loadMoreBtn.style.display = 'block';
            }
        }
    }

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase().trim();
            if (searchTerm === '') {
                filteredItems = [...allCurrentItems];
            } else {
                filteredItems = allCurrentItems.filter(item => {
                    const name = item["Name"] ? item["Name"].toLowerCase() : "";
                    return name.includes(searchTerm);
                });
            }
            currentItemIndex = 0;
            itemsContainer.innerHTML = '';
            if (filteredItems.length === 0) {
                itemsContainer.innerHTML = '<p style="text-align:center; width:100%; color:#aaa;">Nothing found 😔</p>';
                if (loadMoreBtn) loadMoreBtn.style.display = 'none';
            } else {
                renderMoreItems();
            }
        });
    }

    if (loadMoreBtn) loadMoreBtn.addEventListener('click', renderMoreItems);

    categoryBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetBtn = e.target.closest('.category-btn');
            if (!targetBtn) return;
            categoryBtns.forEach(b => b.classList.remove('active'));
            targetBtn.classList.add('active');
            currentCategory = targetBtn.dataset.type;
            fetchItems(currentCategory);
        });
    });

    fetchItems(currentCategory);

    // ==========================================
    // --- ЛОГІКА ДЕРЕВА КРАФТІВ (SERVER-SIDE) ---
    // ==========================================
    const craftSearchInput = document.getElementById('craft-search-input');
    const craftingTreeContainer = document.getElementById('crafting-tree-container');

    // НОВА ФУНКЦІЯ: просто малює готовий JSON, який прийшов від сервера
    function buildServerCraftingTreeDOM(nodeData) {
        const isUnknown = nodeData.name.startsWith('Невідомий');
        const imageName = nodeData.name.replace(/ /g, '_');
        const imageSrc = isUnknown
            ? 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
            : `http://localhost:3000/data/img_sprites/${imageName}.png`;

        const nodeDiv = document.createElement('div');
        nodeDiv.className = 'craft-node';

        const itemDiv = document.createElement('div');
        itemDiv.className = 'craft-item';

        itemDiv.setAttribute('draggable', 'true');
        itemDiv.addEventListener('dragstart', (e) => {
            const lookupName = String(nodeData.name).trim().toLowerCase();
            const stats = detailedItemsMap[lookupName] || { category: 'material', defense: 0, tooltip: "" };

            const itemData = {
                name: nodeData.name,
                imageSrc: imageSrc,
                category: stats.category,
                defense: stats.defense,
                tooltip: stats.tooltip
            };
            e.dataTransfer.setData('application/json', JSON.stringify(itemData));
            e.dataTransfer.effectAllowed = 'copy';
        });

        itemDiv.style.cursor = 'pointer';
        itemDiv.addEventListener('click', async () => {
            const itemName = String(nodeData.name).trim();


            if (modalItemName && modalStatsTable && modalOverlay) {
                modalItemImg.src = imageSrc;
                modalItemName.textContent = itemName;
                modalStatsTable.innerHTML = '<tr><td style="text-align:center; padding: 20px;">Searching in the database... ⏳</td></tr>';
                modalOverlay.style.display = 'flex';
            }

            let fullData = null;


            if (allCurrentItems) {
                fullData = allCurrentItems.find(i => String(i["Name"]).trim() === itemName);
            }


            if (!fullData) {
                if (!window.globalFullCache) window.globalFullCache = {};

                if (window.globalFullCache[itemName]) {
                    fullData = window.globalFullCache[itemName];
                } else {
                    const categories = ['weapon', 'armor', 'accessory', 'crafting_material'];
                    for (const cat of categories) {
                        try {
                            const res = await fetch(`http://localhost:3000/api/items/${cat}`);
                            if (res.ok) {
                                const data = await res.json();

                                data.forEach(item => {
                                    if (item["Name"]) window.globalFullCache[String(item["Name"]).trim()] = item;
                                });

                                if (window.globalFullCache[itemName]) {
                                    fullData = window.globalFullCache[itemName];
                                    break;
                                }
                            }
                        } catch (e) {
                            console.error("Error occurred while loading items in the background:", e);
                        }
                    }
                }
            }


            if (fullData) {
                openItemModal(fullData);
            } else {
                openItemModal({ "Name": itemName, "Info": "Detailed statistics are not available (basic material)" });
            }
        });

        itemDiv.innerHTML = `
            <img src="${imageSrc}" alt="${nodeData.name}" style="${isUnknown ? 'display:none;' : 'max-width: 32px; max-height: 32px;'}" onerror="this.style.display='none'">
            <span class="craft-item-name" style="${isUnknown ? 'color: #ff6b6b;' : ''}">${nodeData.name}</span>
            <span class="craft-item-qty">x${nodeData.quantity}</span>
        `;
        nodeDiv.appendChild(itemDiv);

        if (nodeData.cycle) {
            const cycleWarning = document.createElement('div');
            cycleWarning.style.color = '#ff6b6b';
            cycleWarning.style.fontSize = '0.8rem';
            cycleWarning.style.marginLeft = '24px';
            cycleWarning.style.marginTop = '4px';
            cycleWarning.textContent = '🔄 Cyclic recipe (stopped)';
            nodeDiv.appendChild(cycleWarning);
            return nodeDiv;
        }

        if (nodeData.children && nodeData.children.length > 0) {
            const childrenDiv = document.createElement('div');
            childrenDiv.className = 'craft-children';
            nodeData.children.forEach(child => {
                childrenDiv.appendChild(buildServerCraftingTreeDOM(child));
            });
            nodeDiv.appendChild(childrenDiv);
        }

        return nodeDiv;
    }

    if (craftSearchInput && craftingTreeContainer) {
        craftSearchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase().trim();
            craftingTreeContainer.innerHTML = '';

            if (term.length < 2) {
                craftingTreeContainer.innerHTML = '<p style="text-align: center; color: #888;">Enter at least 2 letters to search.</p>';
                return;
            }

            const matchedItems = globalItemsList.filter(item => {
                const name = item["Name"] || "";
                return name.toLowerCase().includes(term);
            }).slice(0, 30);

            if (matchedItems.length === 0) {
                craftingTreeContainer.innerHTML = '<p style="text-align: center; color: #ff6b6b;">Nothing found 😔</p>';
                return;
            }

            const grid = document.createElement('div');
            grid.className = 'items-grid';
            grid.style.marginTop = '20px';

            matchedItems.forEach(item => {
                const name = item["Name"];
                let id = item["Item ID"] || item["ID"];
                if (String(id).trim() === "-1") id = "989"; // Фікс для невідомих ID

                const imageName = name.replace(/ /g, '_');
                const imageSrc = `http://localhost:3000/data/img_sprites/${imageName}.png`;

                const card = document.createElement('div');
                card.className = 'item-card';
                card.style.cursor = 'pointer';
                card.style.transition = 'transform 0.2s, border-color 0.2s';

                card.onmouseover = () => card.style.borderColor = 'var(--accent-green)';
                card.onmouseout = () => card.style.borderColor = 'var(--border-main)';

                card.innerHTML = `
                    <div class="item-icon-box">
                        <img src="${imageSrc}" alt="${name}" style="max-width: 40px; max-height: 40px;" onerror="this.style.display='none'">
                    </div>
                    <div class="item-title">${name}</div>
                `;

                card.setAttribute('draggable', 'true');
                card.addEventListener('dragstart', (e) => {
                    const lookupName = String(name).trim().toLowerCase();
                    const stats = detailedItemsMap[lookupName] || { category: 'material', defense: 0, tooltip: "" };

                    const itemData = {
                        name: name, imageSrc: imageSrc, category: stats.category, defense: stats.defense, tooltip: stats.tooltip
                    };
                    e.dataTransfer.setData('application/json', JSON.stringify(itemData));
                    e.dataTransfer.effectAllowed = 'copy';
                });

                // НОВИЙ FETCH ДО БЕКЕНДУ ЗАМІСТЬ ЛОКАЛЬНИХ ОБЧИСЛЕНЬ
                card.addEventListener('click', async () => {
                    craftSearchInput.value = name;
                    craftingTreeContainer.innerHTML = '<p style="text-align: center; color: #var(--accent-green);">Calculating on the server... ⏳</p>';

                    try {
                        const response = await fetch(`http://localhost:3000/api/crafting/tree/${id}`);
                        if (!response.ok) throw new Error('Network error');

                        const treeData = await response.json();
                        craftingTreeContainer.innerHTML = '';
                        const treeDOM = buildServerCraftingTreeDOM(treeData);
                        craftingTreeContainer.appendChild(treeDOM);
                    } catch (err) {
                        console.error(err);
                        craftingTreeContainer.innerHTML = '<p style="text-align: center; color: #ff6b6b;">Error connecting to the server 😔</p>';
                    }
                });

                grid.appendChild(card);
            });
            craftingTreeContainer.appendChild(grid);
        });
    }
    // ==========================================
    // --- ЛОГІКА ПЛАНУВАЛЬНИКА БІЛДІВ ---
    // ==========================================
    const diffButtons = document.querySelectorAll('.diff-btn');
    const demonHeartWrapper = document.getElementById('demon-heart-wrapper');
    const demonHeartCb = document.getElementById('demon-heart-cb');
    const accessoriesContainer = document.getElementById('accessories-container');

    let currentMode = 'normal';
    let hasDemonHeart = false;

    function updateAccessorySlots() {
        if (!accessoriesContainer) return;
        let slotsCount = 5;
        if (currentMode === 'expert') slotsCount = 5 + (hasDemonHeart ? 1 : 0);
        else if (currentMode === 'master') slotsCount = 6 + (hasDemonHeart ? 1 : 0);

        const currentAccs = {};
        document.querySelectorAll('#accessories-container .build-slot:not(.empty)').forEach(slot => {
            currentAccs[slot.dataset.slot] = {
                html: slot.innerHTML, defense: slot.dataset.defense, tooltip: slot.dataset.tooltip, itemName: slot.dataset.itemName
            };
        });

        accessoriesContainer.innerHTML = '';
        for (let i = 1; i <= slotsCount; i++) {
            const slot = document.createElement('div');
            slot.className = 'build-slot empty';
            slot.dataset.slot = `acc${i}`;

            const savedItem = currentAccs[`acc${i}`];
            if (savedItem) {
                slot.classList.remove('empty');
                slot.innerHTML = savedItem.html;
                slot.dataset.defense = savedItem.defense;
                slot.dataset.tooltip = savedItem.tooltip;
                slot.dataset.itemName = savedItem.itemName;

                slot.onclick = () => {
                    slot.classList.add('empty');
                    slot.innerHTML = '';
                    delete slot.dataset.defense;
                    delete slot.dataset.tooltip;
                    delete slot.dataset.itemName;
                    updateBuildSummary();
                    saveBuildState();
                    slot.onclick = null;
                };
            }
            accessoriesContainer.appendChild(slot);
        }
    }

    function saveBuildState() {
        const buildData = { mode: currentMode, demonHeart: hasDemonHeart, slots: {} };
        document.querySelectorAll('.build-slot:not(.empty)').forEach(slot => {
            buildData.slots[slot.dataset.slot] = {
                name: slot.dataset.itemName,
                imageSrc: slot.querySelector('img').src,
                defense: slot.dataset.defense,
                tooltip: slot.dataset.tooltip
            };
        });
        localStorage.setItem('terrariaBuildState', JSON.stringify(buildData));
    }

    function loadBuildState() {
        const saved = localStorage.getItem('terrariaBuildState');
        if (!saved) return;

        try {
            const buildData = JSON.parse(saved);
            currentMode = buildData.mode || 'normal';
            hasDemonHeart = buildData.demonHeart || false;

            diffButtons.forEach(b => b.classList.remove('active'));
            const activeBtn = document.querySelector(`.diff-btn[data-diff="${currentMode}"]`);
            if (activeBtn) activeBtn.classList.add('active');

            if (demonHeartWrapper && demonHeartCb) {
                if (currentMode === 'normal') {
                    demonHeartWrapper.classList.add('disabled');
                    demonHeartCb.disabled = true;
                } else {
                    demonHeartWrapper.classList.remove('disabled');
                    demonHeartCb.disabled = false;
                }
                demonHeartCb.checked = hasDemonHeart;
            }

            updateAccessorySlots();

            if (buildData.slots) {
                Object.keys(buildData.slots).forEach(slotId => {
                    const slot = document.querySelector(`.build-slot[data-slot="${slotId}"]`);
                    if (slot) {
                        const item = buildData.slots[slotId];
                        slot.classList.remove('empty');
                        slot.innerHTML = `<img src="${item.imageSrc}" alt="${item.name}" title="${item.name}">`;
                        slot.dataset.defense = item.defense;
                        slot.dataset.tooltip = item.tooltip;
                        slot.dataset.itemName = item.name;

                        slot.onclick = () => {
                            slot.classList.add('empty');
                            slot.innerHTML = '';
                            delete slot.dataset.defense;
                            delete slot.dataset.tooltip;
                            delete slot.dataset.itemName;
                            updateBuildSummary();
                            saveBuildState();
                            slot.onclick = null;
                        };
                    }
                });
            }
        } catch (e) {
            console.error("Error loading saved state:", e);
        }
    }

    diffButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            diffButtons.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentMode = e.target.dataset.diff;
            if (demonHeartWrapper && demonHeartCb) {
                if (currentMode === 'normal') {
                    demonHeartWrapper.classList.add('disabled');
                    demonHeartCb.disabled = true;
                    demonHeartCb.checked = false;
                    hasDemonHeart = false;
                } else {
                    demonHeartWrapper.classList.remove('disabled');
                    demonHeartCb.disabled = false;
                }
            }
            updateAccessorySlots();
            updateBuildSummary();
            saveBuildState();
        });
    });

    if (demonHeartCb) {
        demonHeartCb.addEventListener('change', (e) => {
            hasDemonHeart = e.target.checked;
            updateAccessorySlots();
            updateBuildSummary();
            saveBuildState();
        });
    }



    function updateBuildSummary() {
        const slots = document.querySelectorAll('.build-slot:not(.empty)');
        let totalDefense = 0;
        let allEffects = [];

        slots.forEach(slot => {
            const def = parseInt(slot.dataset.defense) || 0;
            totalDefense += def;
            const tooltip = slot.dataset.tooltip;
            if (tooltip && tooltip.trim() !== "" && tooltip !== "undefined") {
                allEffects.push(tooltip);
            }
        });

        const headSlot = document.querySelector('.build-slot[data-slot="head"]');
        const torsoSlot = document.querySelector('.build-slot[data-slot="torso"]');
        const legsSlot = document.querySelector('.build-slot[data-slot="legs"]');
        const setBonusDisplay = document.getElementById('set-bonus-display');

        if (setBonusDisplay) setBonusDisplay.textContent = '';

        if (headSlot && torsoSlot && legsSlot &&
            !headSlot.classList.contains('empty') &&
            !torsoSlot.classList.contains('empty') &&
            !legsSlot.classList.contains('empty')) {

            const headName = headSlot.dataset.itemName;
            const torsoName = torsoSlot.dataset.itemName;
            const legsName = legsSlot.dataset.itemName;

            const activeSet = allSets.find(setObj => {
                const pieces = setObj["Set Pieces"];
                return pieces && pieces.includes(headName) && pieces.includes(torsoName) && pieces.includes(legsName);
            });

            if (activeSet && setBonusDisplay) {
                setBonusDisplay.textContent = `Set-Bonus: ${activeSet["Set Bonus"]}`;
                const setTotalDef = parseInt(activeSet["Defense"]) || 0;
                const partsDef = (parseInt(headSlot.dataset.defense) || 0) +
                    (parseInt(torsoSlot.dataset.defense) || 0) +
                    (parseInt(legsSlot.dataset.defense) || 0);

                const bonusDef = setTotalDef - partsDef;
                if (bonusDef > 0) totalDefense += bonusDef;
            }
        }

        const defElement = document.getElementById('total-defense');
        if (defElement) defElement.textContent = `🛡️ Defense: ${totalDefense}`;

        const ul = document.getElementById('build-effects-list');
        if (ul) {
            ul.innerHTML = '';
            allEffects.forEach(effect => {
                const li = document.createElement('li');
                li.textContent = effect;
                ul.appendChild(li);
            });
        }
    }

    // --- DRAG AND DROP ---
    const sidebarRight = document.querySelector('.sidebar-right');
    if (sidebarRight) {
        sidebarRight.addEventListener('dragover', (e) => {
            e.preventDefault();
            const slot = e.target.closest('.build-slot');
            if (slot) e.dataTransfer.dropEffect = 'copy';
        });

        sidebarRight.addEventListener('drop', (e) => {
            e.preventDefault();
            const slot = e.target.closest('.build-slot');
            if (!slot) return;

            const dataStr = e.dataTransfer.getData('application/json');
            if (!dataStr) return;

            const itemData = JSON.parse(dataStr);
            const targetSlotType = slot.dataset.slot;

            // ВАЛІДАЦІЯ
            if (targetSlotType.startsWith('acc')) {
                if (itemData.category !== 'accessory') {
                    alert(`Ей, ${itemData.name} — це не аксесуар!`); return;
                }
            }
            else if (['head', 'torso', 'legs'].includes(targetSlotType)) {
                if (itemData.category !== 'armor') {
                    alert(`You can only put armor here, not ${itemData.name}!`); return;
                }
                const itemNameLower = itemData.name.toLowerCase();
                if (targetSlotType === 'head' && !itemNameLower.match(/helmet|headgear|mask|hat|hood|cap|goggles|visage/)) {
                    alert("This armor piece doesn't look like a helmet!"); return;
                }
                if (targetSlotType === 'torso' && !itemNameLower.match(/chainmail|breastplate|shirt|robe|plate|tuxedo|suit/)) {
                    alert("This armor piece doesn't look like a torso piece!"); return;
                }
                if (targetSlotType === 'legs' && !itemNameLower.match(/greaves|leggings|boots|pants/)) {
                    alert("This armor piece doesn't look like leg armor!"); return;
                }
            }
            else {
                return;
            }

            slot.classList.remove('empty');
            slot.innerHTML = `<img src="${itemData.imageSrc}" alt="${itemData.name}" title="${itemData.name}">`;
            slot.dataset.defense = itemData.defense;
            slot.dataset.tooltip = itemData.tooltip;
            slot.dataset.itemName = itemData.name;

            updateBuildSummary();
            saveBuildState();

            slot.onclick = () => {
                slot.classList.add('empty');
                slot.innerHTML = '';
                delete slot.dataset.defense;
                delete slot.dataset.tooltip;
                delete slot.dataset.itemName;
                updateBuildSummary();
                saveBuildState();
                slot.onclick = null;
            };
        });
    }

    // ==========================================
    // --- ЛОГІКА МОДАЛЬНОГО ВІКНА (ВІКІ-КАРТКА) ---
    // ==========================================
    const modalOverlay = document.getElementById('item-modal-overlay');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const modalItemImg = document.getElementById('modal-item-img');
    const modalItemName = document.getElementById('modal-item-name');
    const modalStatsTable = document.getElementById('modal-stats-table');

    function openItemModal(itemObj) {
        if (!modalOverlay) return;
        const name = itemObj["Name"] || "Невідомо";
        const imageName = name.replace(/ /g, '_');

        const folderName = itemObj["Max Life"] ? 'npc_sprites' : 'img_sprites';

        modalItemImg.src = `http://localhost:3000/data/${folderName}/${imageName}.png`;
        modalItemName.textContent = name;

        modalStatsTable.innerHTML = '';
        const ignoreKeys = ['ID', 'Name', '_id', 'Research', 'Sources'];

        for (const key in itemObj) {
            if (itemObj[key] && !ignoreKeys.includes(key)) {
                const tr = document.createElement('tr');
                const th = document.createElement('th');
                th.textContent = key;
                const td = document.createElement('td');

                if (typeof itemObj[key] === 'object') {
                    td.textContent = Object.values(itemObj[key]).join(', ');
                } else {
                    td.textContent = itemObj[key];
                }

                tr.appendChild(th);
                tr.appendChild(td);
                modalStatsTable.appendChild(tr);
            }
        }
        modalOverlay.style.display = 'flex';
    }

    if (modalCloseBtn) modalCloseBtn.addEventListener('click', () => modalOverlay.style.display = 'none');
    if (modalOverlay) modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) modalOverlay.style.display = 'none';
    });

});