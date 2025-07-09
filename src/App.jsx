import { ReactFlowProvider } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import FlowChart from './components/FlowChart';

const App = () => {
  return (
    <div className="w-screen h-screen">
      <ReactFlowProvider>
        <FlowChart />
      </ReactFlowProvider>
    </div>  
  );
};

export default App;