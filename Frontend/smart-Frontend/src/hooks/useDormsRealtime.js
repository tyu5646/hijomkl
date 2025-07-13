import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

// Custom hook สำหรับดึงข้อมูลหอพักแบบเรียลไทม์
function useDormsRealtime() {
  const [dorms, setDorms] = useState([]);
  useEffect(() => {
    const socket = io('http://localhost:3001');
    const fetchDorms = () => {
      fetch('http://localhost:3001/dorms')
        .then(res => res.json())
        .then(setDorms)
        .catch(() => {});
    };
    fetchDorms();
    socket.on('dorms-updated', fetchDorms);
    return () => socket.disconnect();
  }, []);
  return dorms;
}

export default useDormsRealtime;
