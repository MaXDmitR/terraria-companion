📖 Project Overview
Terraria Companion is a comprehensive, interactive web application built to serve as the ultimate database and planning tool for players of the popular sandbox game, Terraria. Instead of relying on static wiki pages, this application provides a dynamic, real-time interface to search for items, calculate complex multi-tiered crafting recipes, and simulate character builds.

The project strictly adheres to a Client-Server Architecture, separating the user interface logic from data processing. It utilizes a custom-built RESTful API powered by Node.js and Express, connected to a highly flexible MongoDB NoSQL database to handle the game's highly polymorphic item data.

✨ Key Features
🔍 Interactive Item Catalog
Dynamic Grid Interface: Browse hundreds of items seamlessly without page reloads.

Live Search & Filtering: Instantly filter the database by categories (Weapons, Armor, Accessories, Materials) or use the live text search to pinpoint specific items.

Detailed Info Modals: Clicking any item card generates a dynamically populated overlay containing comprehensive statistics (Damage, Knockback, Rarity, Sell Price, Tooltips) fetched instantly from the API or local cache.

🌳 Recursive Crafting Calculator
Multi-Level Tree Visualization: Explore complex crafting chains down to the base materials.

Smart Recursion Algorithm: The backend utilizes a specialized recursive function to traverse the crafting graph.

Cycle Prevention: Implements structural checks (using JavaScript Set) to prevent infinite loops in cyclic crafting recipes, ensuring optimal server performance and stability.

🛡️ Dynamic Build Planner (Drag & Drop)
Interactive Equipment Slots: Simulate your character's loadout by dragging items from the catalog directly into designated equipment slots (Head, Torso, Legs, Accessories).

Automated Stat Aggregation: The application instantly calculates your total defensive stats based on equipped items.

Set Bonus Detection: Automatically detects when a complete armor set is equipped and dynamically applies and displays the hidden Set Bonuses.

Difficulty Scaling: Adapts the number of available accessory slots based on the selected World Difficulty (Normal, Expert, Master) and the usage of the "Demon Heart" item.

🏗️ Architecture & Technology Stack
The application is built using a modern JavaScript-centric ecosystem, heavily relying on the MVC (Model-View-Controller) design pattern on the backend for modularity and scalability.

Backend (RESTful API)
Runtime Environment: Node.js

Web Framework: Express.js

Database: MongoDB (Cloud Atlas cluster)

ODM: Mongoose (Utilizing strict: false schemas to accommodate the highly variable and polymorphic nature of Terraria's item datasets without generating sparse relational tables).

Environment Management: dotenv for secure credential storage.

Frontend (SPA)
Structure & Styling: HTML5 and Custom CSS3 (CSS Variables, Flexbox, CSS Grid).

Logic: Vanilla JavaScript (ES6+).

Data Fetching: Native Fetch API for asynchronous communication with the backend endpoints.

State Management: localStorage for preserving user build configurations across sessions.

📂 Repository Structure
Plaintext
terraria-companion/
├── client/                 # Frontend SPA assets
│   ├── index.html          # Main application entry point
│   ├── style.css           # Global stylesheet and UI variables
│   ├── app.js              # Client-side logic, Drag-and-Drop, Fetch calls
│   └── bg.png              # UI background assets
├── server/                 # Backend Node.js application
│   ├── controllers/        # Business logic handlers
│   │   ├── buildController.js      # Handles armor sets and bonuses
│   │   ├── craftingController.js   # Recursive crafting algorithms
│   │   ├── dictionaryController.js # Lightweight ID-to-Name mapping
│   │   └── itemController.js       # Database querying and filtering
│   ├── models/             # Mongoose DB Schemas
│   │   ├── ArmorSet.js
│   │   ├── IdReference.js
│   │   ├── ItemData.js
│   │   └── Recipe.js
│   ├── routes/             # Express API route definitions
│   │   └── itemRoutes.js
│   ├── db.js               # MongoDB connection logic
│   └── server.js           # Express app initialization
├── dataset/                # Raw JSON data sources and image sprites
├── package.json            # Node.js dependencies and scripts
└── .gitignore              # Ignored files (node_modules, .env)
🚀 Installation & Local Setup
To run this application locally on your machine, follow these steps:

1. Clone the Repository
Bash
git clone https://github.com/your-username/terraria-companion.git
cd terraria-companion
2. Install Dependencies
Ensure you have Node.js installed, then run:

Bash
npm install
3. Environment Variables Configuration
For security reasons, database credentials are not tracked in version control. You must create a local environment file.

Create a file named exactly .env in the root directory.

Add your MongoDB connection string (provided by your administrator or your own MongoDB Atlas cluster):

Фрагмент коду
MONGO_URI=mongodb://<username>:<password>@<cluster-url>/?ssl=true&replicaSet=atlas-...&authSource=admin&appName=TerrariaDB
4. Start the Server
Start the backend Express server:

Bash
node server/server.js
The terminal should output: Успішно підключено до MongoDB! and Server running on port 3000.

5. Launch the Application
Open the client/index.html file in your preferred modern web browser (or use an extension like VS Code Live Server) to begin using the Terraria Companion.

📡 API Endpoints Summary
The backend exposes several modular RESTful endpoints serving JSON data to the frontend:

GET /api/items/:category - Fetches a filtered list of full item statistics based on category (e.g., weapon, armor).

GET /api/crafting/tree/:itemId - Triggers the recursive algorithm to build and return a complete crafting hierarchy for a specific item.

GET /data/id_references/set.json - Returns logic matrices for armor Set Bonuses.

GET /data/id_references/items.json - Returns a lightweight dictionary for performance-optimized search parsing.