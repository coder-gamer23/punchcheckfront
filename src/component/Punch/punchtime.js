import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TextField from '@mui/material/TextField';
import AccountCircle from '@mui/icons-material/AccountCircle';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';



function TimeCalculationComponent() {
  const [employeeData, setEmployeeData] = useState([]);
  const [isloading, setisloading] = useState(false);
  const [firstPunchIn, setFirstPunchIn] = useState('--:--')
  const [breaktime,setbreaktime] = useState('--:--');
  const [workedtime,setworkedtime] = useState('--:--');
  const [remainingtime,setremainingtime] = useState('--:--:--');
  const [punchouttime,setpunchouttime] = useState('--:--')
  const [twelvepunchouttime,settwelvepunchouttime] = useState('--:--')
  const [empcode,setempcode] = useState('')

  useEffect(() => {
    const decrementTime = () => {
      const [hours, minutes, seconds] = remainingtime.split(':').map(Number);
      let totalSeconds = hours * 3600 + minutes * 60 + seconds;
      totalSeconds = Math.max(0, totalSeconds - 1);
      const updatedHours = Math.floor(totalSeconds / 3600);
      const updatedMinutes = Math.floor((totalSeconds % 3600) / 60);
      const updatedSeconds = totalSeconds % 60;
      const updatedTime = `${String(updatedHours).padStart(2, '0')}:${String(updatedMinutes).padStart(2, '0')}:${String(updatedSeconds).padStart(2, '0')}`;
      setremainingtime(updatedTime);
    };
    if (remainingtime !== '--:--:--') {
      const timerInterval = setInterval(decrementTime, 1000);
      return () => clearInterval(timerInterval);
    }
  }, [remainingtime]);
 
  useEffect(() => {
    const calculateTime = (data) =>  {
      if (data.length > 0){
          let first_punchin_time = new Date(data[0].punchTime);
          setFirstPunchIn((first_punchin_time.getHours() < 10 ? `0${first_punchin_time.getHours()}`:first_punchin_time.getHours())  +':'+ first_punchin_time.getMinutes())
          let overall_break_time = '00:00';
          let overall_productivity_time = '00:00'
          data.forEach((e)=>{
              if (e.BreakMinute.trim().length !== 0 && e.eventType.toLowerCase() === 'in') {
                overall_break_time = addTimes(overall_break_time,e.BreakMinute)
              }
              if (e.TotlMinute.trim().length !== 0 && e.eventType.toLowerCase() === 'out') {
                overall_productivity_time = addTimes(overall_productivity_time,e.TotlMinute)
              }
          })
          if ( data[data.length - 1].eventType.toLowerCase() === 'in' ) {
            overall_productivity_time = addTimes(overall_productivity_time,subtractTimeFromCurrent((new Date(data[data.length - 1].punchTime).getHours() < 10 ? `0${new Date(data[data.length - 1].punchTime).getHours()}`:new Date(data[data.length - 1].punchTime).getHours())  +':'+ new Date(data[data.length - 1].punchTime).getMinutes(),true))
          }
          if ( data[data.length - 1].eventType.toLowerCase() === 'out' ) {
            overall_break_time = addTimes(overall_break_time,subtractTimeFromCurrent((new Date(data[data.length - 1].punchTime).getHours() < 10 ? `0${new Date(data[data.length - 1].punchTime).getHours()}`:new Date(data[data.length - 1].punchTime).getHours())  +':'+ new Date(data[data.length - 1].punchTime).getMinutes(),true))
          }
          setbreaktime(overall_break_time)
          setworkedtime(overall_productivity_time)
          let outtime = OutTime(overall_productivity_time)
          setpunchouttime(outtime)
          let [hours_outtime1, minutes_outtime1] = outtime.split(':').map(Number);
          if (hours_outtime1 > 12) {
            minutes_outtime1 = minutes_outtime1 < 10 ? `0${minutes_outtime1}` : minutes_outtime1;
            hours_outtime1 = hours_outtime1 - 12 < 10 ? (`0${hours_outtime1 - 12}:${minutes_outtime1}`):(`${hours_outtime1 - 12}:${minutes_outtime1}`);
          }
          settwelvepunchouttime(hours_outtime1)
          setremainingtime(subtractTimeFromCurrent(outtime,false)+`:${new Date().getSeconds() < 10 ? ('0'+new Date().getSeconds()) : (new Date().getSeconds())}`) 
          setisloading(false);     
      }    
    }
    
    if(employeeData.length > 0) {
        calculateTime(employeeData);
    }
  },[employeeData]);
   
  function formatteddate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const day = String(today.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
    return formattedDate;
}
async function fetchEmployeeData() {
    setisloading(true);
    try {
      const payload = {
        empCode: empcode,
        punchIn: `${formatteddate()}T00:00:00`,
        punchOut: `${formatteddate()}T23:59:00`,
      };

      const response = await axios.post('http://localhost:4000/api/punchDetails', payload);
      setEmployeeData(response.data); // Set response data to state
    } catch (error) {
        setisloading(false)
      console.error("Error fetching employee data:", error);
    }
  }


function addTimes(time1, time2) {
  const [hours1, minutes1] = time1.split(':').map(Number);
  const [hours2, minutes2] = time2.split(':').map(Number);
  let totalMinutes = (hours1 + hours2) * 60 + minutes1 + minutes2;
  totalMinutes = (totalMinutes + 1440) % 1440;
  const resultHours = Math.floor(totalMinutes / 60);
  const resultMinutes = totalMinutes % 60;
  const result = `${String(resultHours).padStart(2, '0')}:${String(resultMinutes).padStart(2, '0')}`;
  return result;
}

function subtractTimeFromCurrent(inputTime,great) {
  const now = new Date();
  const [inputHours, inputMinutes] = inputTime.split(':').map(Number);
  now.setHours(inputHours, inputMinutes, 0, 0);
  if (((!great) && (now < new Date())) || ((great) && (now > new Date()))){
    return '--:--'
  }
  let timeDifferenceMinutes = great ? Math.floor((new Date() - now) / (1000 * 60)) : Math.floor(( now - new Date()) / (1000 * 60));
  const resultHours = Math.floor(timeDifferenceMinutes / 60);
  const resultMinutes = timeDifferenceMinutes % 60;
  const result = `${String(resultHours).padStart(2, '0')}:${String(resultMinutes).padStart(2, '0')}`;
  return result;
}

function OutTime(Time) {
  const now = new Date();
  const [inputHours, inputMinutes] = Time.split(':').map(Number);
  now.setHours(inputHours, inputMinutes, 0, 0);
  now.setHours(now.getHours()-9);
  console.log("now",now)
  const timeDifferenceMinutes = Math.floor((new Date() - now ) / (1000 * 60));
  const resultHours = Math.floor(timeDifferenceMinutes / 60);
  const resultMinutes = timeDifferenceMinutes % 60;
  const result = `${String(resultHours).padStart(2, '0')}:${String(resultMinutes).padStart(2, '0')}`;
  return result;
}


  const textchange = (event) =>{
    setempcode(event.target.value.toUpperCase());
  }


  return (
    <>
    <div style={{ display:'flex', justifyContent: 'center', gap: '120px', marginTop: '20px'}}>
    <div>
        <Box sx={{ display: 'flex'}}>
        <AccountCircle sx={{ color: 'action.active', mr: 1, my: 0.5 }} />
        <TextField id="input-with-sx" label="Emp. Code" variant="standard" onChange={(e)=>{textchange(e)}} value={empcode} />
      </Box>
    </div>
    <Button variant="outlined" onClick={fetchEmployeeData}>Check Work hours</Button>
    </div>
    {isloading ? <div style={{display: "flex", justifyContent : "center"}}><img src="https://gifdb.com/images/high/setting-sport-timer-animation-9ef3dr57hfo6rp59.gif" alt="" /></div>  :
    <div style={{ display: 'grid', justifyContent: 'center', marginTop: '20px' }}>
      <h1>Time Calculation</h1>
      <p>Punched In: {firstPunchIn}</p>
      <p>Total Productivity Time : {workedtime}</p>
      <p>Total Break Time: {breaktime} </p>
      <p>Expected Punch Out Time(24hrs) : {punchouttime}</p>
      <p>Expected Punch Out Time(12hrs) : {twelvepunchouttime}</p>
      <p>Remaining Time : {remainingtime} </p>
    </div> } 
    </>
  );
}

export default TimeCalculationComponent;
