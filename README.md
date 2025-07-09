# ClickUp Flow - Interactive Flowchart Builder

A powerful, interactive flowchart application built with React and ReactFlow that provides comprehensive visual editing capabilities for process workflows.

![React](https://img.shields.io/badge/React-18.x-blue)
![Vite](https://img.shields.io/badge/Vite-5.x-purple)
![ReactFlow](https://img.shields.io/badge/ReactFlow-12.x-green)

## ✨ Features

### 🎯 **Visual Node Editor**
- **Right-click any node** to open the comprehensive editor
- **Live text editing** with input field and instant save
- **Connection handle management** - toggle handles on/off for each side
- **Auto-persistence** - all changes saved to localStorage

### 🔗 **Advanced Connection System**
- **Drag-and-drop connections** between any compatible handles
- **Smart handle validation** - prevents invalid connections
- **Visual handle indicators** - green (outputs) and blue (inputs)
- **Connection deletion** - select edge + Delete/Backspace
- **Custom connection persistence** across browser sessions

### 📱 **Interactive Controls**
- **Multi-node selection** - Hold Shift + Click to select multiple nodes
- **Drag positioning** with automatic position saving
- **Level-focused navigation** - jump to CRM, Milestones, or Tasks
- **Zoom and pan** with viewport persistence
- **Handle visibility toggle** for cleaner views

### 🏗️ **Three-Level Hierarchy**
1. **Level 1: CRM Logic Flow** - Business process automation
2. **Level 2: Project Milestones** - Key project phases  
3. **Level 3: Milestone Tasks** - Detailed task breakdown

### 💾 **Complete Persistence**
- Node positions and text customizations
- Connection handle configurations
- Custom connections and modifications
- Viewport position and zoom level
- All data stored in browser localStorage

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd clickupflow
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   ```
   http://localhost:5173
   ```

## 🎮 How to Use

### **Basic Navigation**
- **Scroll** to zoom in/out
- **Click and drag** on empty space to pan
- **Use toolbar buttons** to focus on specific levels

### **Editing Nodes**
1. **Right-click any node** → Context menu opens
2. **Edit text** in the input field at top
3. **Press Enter** or click "💾 Save Text"
4. **Toggle connection handles** using the colored buttons below
5. **Reset options** available for both text and handles

### **Creating Connections**
1. **Drag from any green handle** (output) to any blue handle (input)
2. **Connection appears instantly** and saves automatically
3. **Delete connections** by selecting the edge and pressing Delete/Backspace

### **Multi-Selection**
1. **Hold Shift** and click multiple nodes
2. **Drag any selected node** to move all selected nodes together
3. **Use Delete key** to remove selected nodes

### **Reset Options**
- **Reset View** - Return to overview zoom level
- **Reset Positions** - Restore default node positions
- **Reset All Handles** - Enable all connection handles
- **Reset All Connections** - Restore original connection layout
- **Reset All Text** - Restore original node labels

## 🛠️ Built With

- **[React 18](https://reactjs.org/)** - UI framework
- **[Vite](https://vitejs.dev/)** - Build tool and dev server
- **[ReactFlow](https://reactflow.dev/)** - Node-based UI library
- **[Xyflow React](https://www.xyflow.com/)** - Advanced flow library components

## 📁 Project Structure

```
clickupflow/
├── src/
│   ├── App.jsx          # Main application component
│   ├── main.jsx         # Application entry point
│   └── index.css        # Global styles
├── public/              # Static assets
├── package.json         # Dependencies and scripts
├── vite.config.js       # Vite configuration
└── README.md           # This file
```

## 🎨 Customization

### **Adding New Nodes**
1. Define node data in the appropriate level section in `App.jsx`
2. Assign position, label, and styling
3. Nodes automatically get full editing capabilities

### **Styling**
- Modify `nodeStyles` object in `App.jsx` for visual themes
- Update handle colors in the `getHandleStyle` function
- Customize edge styles in edge definitions

### **Flow Logic**
- Add new levels by extending the level system
- Create custom node types by adding to `nodeTypes` mapping
- Implement additional persistence by extending localStorage functions

## 📊 Data Persistence

All user modifications are automatically saved to browser localStorage:

- **Node positions** → `flowchart-node-positions`
- **Custom text** → `flowchart-node-labels`  
- **Handle configurations** → `flowchart-handle-configs`
- **Custom connections** → `flowchart-custom-connections`
- **Viewport settings** → `flowchart-viewport`

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🐛 Known Issues

- Handle configurations reset when browser cache is cleared
- Very large flowcharts may impact performance
- Mobile touch interactions need optimization

## 🔮 Future Enhancements

- [ ] Export flowchart as PNG/SVG
- [ ] Import/export flowchart data as JSON
- [ ] Collaborative editing capabilities
- [ ] Custom node templates
- [ ] Advanced styling themes
- [ ] Mobile-responsive touch controls
- [ ] Undo/redo functionality

---

**Built with ❤️ for process visualization and workflow management**