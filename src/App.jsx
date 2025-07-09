import { ReactFlowProvider } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import FlowChart from './components/FlowChart';

const App = () => {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlowProvider>
        <FlowChart />
      </ReactFlowProvider>
    </div>
  );
};

export default App;