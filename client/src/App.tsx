import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Login } from "./pages/Login";
import { SurveyQueue } from "./pages/SurveyQueue";
import { HardwareCheck } from "./pages/HardwareCheck";
import { InterviewRecorder } from "./pages/InterviewRecorder";
import { Success } from "./pages/Success";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/queue" element={<SurveyQueue />} />
        <Route path="/check" element={<HardwareCheck />} />
        <Route path="/record" element={<InterviewRecorder />} />
        <Route path="/success" element={<Success />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;