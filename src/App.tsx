import React, { useState, useEffect, FormEvent, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  Circle, 
  Clock, 
  Plus, 
  Trash2, 
  BookOpen, 
  CheckSquare,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Coffee,
  GraduationCap,
  ChevronDown,
  ChevronUp,
  AlignLeft,
  ListTodo
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ClassSession, Assignment, Tab, ClassInstance, SemesterPeriod } from './types';

const DEFAULT_PERIODS: SemesterPeriod[] = [
  { id: '1', name: 'First Period', start: '2026-03-15', end: '2026-03-29', type: 'study' },
  { id: '2', name: 'Passover Break', start: '2026-03-30', end: '2026-04-26', type: 'break' },
  { id: '3', name: 'Second Period', start: '2026-04-27', end: '2026-07-01', type: 'study' },
];

const getTodayStr = () => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
};

const getPeriodProgress = (period: SemesterPeriod) => {
  const todayStr = getTodayStr();
  const startStr = period.start;
  const endStr = period.end;
  
  const [sY, sM, sD] = startStr.split('-').map(Number);
  const start = new Date(sY, sM - 1, sD);
  
  const [eY, eM, eD] = endStr.split('-').map(Number);
  const end = new Date(eY, eM - 1, eD);
  
  const [tY, tM, tD] = todayStr.split('-').map(Number);
  const today = new Date(tY, tM - 1, tD);
  
  const totalDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
  
  if (todayStr < startStr) {
    return { progress: 0, daysLeft: totalDays, status: 'upcoming' };
  } else if (todayStr > endStr) {
    return { progress: 100, daysLeft: 0, status: 'completed' };
  } else {
    const daysPassed = Math.round((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const daysLeft = totalDays - daysPassed;
    const progress = Math.min(100, Math.max(0, (daysPassed / totalDays) * 100));
    return { progress, daysLeft, status: 'current' };
  }
};

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('schedule');
  const [classes, setClasses] = useState<ClassSession[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [classInstances, setClassInstances] = useState<ClassInstance[]>([]);
  const [semesterPeriods, setSemesterPeriods] = useState<SemesterPeriod[]>(DEFAULT_PERIODS);
  const [selectedDate, setSelectedDate] = useState(getTodayStr());
  
  // Form states
  const [isAddingClass, setIsAddingClass] = useState(false);
  const [isAddingAssignment, setIsAddingAssignment] = useState(false);
  const [isOneOffTask, setIsOneOffTask] = useState(false);
  
  // Load data
  useEffect(() => {
    const savedClasses = localStorage.getItem('student_classes');
    const savedAssignments = localStorage.getItem('student_assignments');
    const savedInstances = localStorage.getItem('student_instances');
    const savedPeriods = localStorage.getItem('student_periods');
    
    if (savedClasses) setClasses(JSON.parse(savedClasses));
    if (savedAssignments) setAssignments(JSON.parse(savedAssignments));
    if (savedInstances) setClassInstances(JSON.parse(savedInstances));
    if (savedPeriods) setSemesterPeriods(JSON.parse(savedPeriods));
  }, []);

  // Save data
  useEffect(() => {
    localStorage.setItem('student_classes', JSON.stringify(classes));
  }, [classes]);

  useEffect(() => {
    localStorage.setItem('student_assignments', JSON.stringify(assignments));
  }, [assignments]);

  useEffect(() => {
    localStorage.setItem('student_instances', JSON.stringify(classInstances));
  }, [classInstances]);

  useEffect(() => {
    localStorage.setItem('student_periods', JSON.stringify(semesterPeriods));
  }, [semesterPeriods]);

  const addClass = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newClass: ClassSession = {
      id: crypto.randomUUID(),
      name: formData.get('name') as string,
      startTime: formData.get('startTime') as string,
      endTime: formData.get('endTime') as string,
      room: formData.get('room') as string,
    };

    if (isOneOffTask) {
      newClass.date = formData.get('date') as string;
    } else {
      newClass.day = formData.get('day') as ClassSession['day'];
    }

    setClasses([...classes, newClass]);
    setIsAddingClass(false);
    e.currentTarget.reset();
  };

  const addAssignment = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const subtasksRaw = formData.get('subtasks') as string;
    const subtasks = subtasksRaw
      ? subtasksRaw.split('\n').filter(line => line.trim()).map(line => ({
          id: crypto.randomUUID(),
          text: line.trim(),
          completed: false
        }))
      : [];

    const newAssignment: Assignment = {
      id: crypto.randomUUID(),
      title: formData.get('title') as string,
      subject: formData.get('subject') as string,
      dueDate: formData.get('dueDate') as string,
      details: formData.get('details') as string,
      subtasks,
      completed: false,
    };
    setAssignments([...assignments, newAssignment]);
    setIsAddingAssignment(false);
    e.currentTarget.reset();
  };

  const toggleSubtask = (assignmentId: string, subtaskId: string) => {
    setAssignments(assignments.map(a => {
      if (a.id === assignmentId) {
        return {
          ...a,
          subtasks: a.subtasks?.map(s => s.id === subtaskId ? { ...s, completed: !s.completed } : s)
        };
      }
      return a;
    }));
  };

  const toggleClassInstance = (classId: string, date: string) => {
    const existingIndex = classInstances.findIndex(i => i.classId === classId && i.date === date);
    if (existingIndex > -1) {
      const newInstances = [...classInstances];
      newInstances[existingIndex].completed = !newInstances[existingIndex].completed;
      setClassInstances(newInstances);
    } else {
      setClassInstances([...classInstances, {
        id: crypto.randomUUID(),
        classId,
        date,
        completed: true
      }]);
    }
  };

  const isClassCompleted = (classId: string, date: string) => {
    return classInstances.some(i => i.classId === classId && i.date === date && i.completed);
  };

  const toggleAssignment = (id: string) => {
    setAssignments(assignments.map(a => a.id === id ? { ...a, completed: !a.completed } : a));
  };

  const deleteClass = (id: string) => {
    setClasses(classes.filter(c => c.id !== id));
    setClassInstances(classInstances.filter(i => i.classId !== id));
  };

  const deleteAssignment = (id: string) => {
    setAssignments(assignments.filter(a => a.id !== id));
  };

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const currentPeriod = useMemo(() => {
    return semesterPeriods.find(p => selectedDate >= p.start && selectedDate <= p.end);
  }, [semesterPeriods, selectedDate]);

  const [y, m, dayNum] = selectedDate.split('-').map(Number);
  const selectedDateObj = new Date(y, m - 1, dayNum);
  const selectedDayName = days[selectedDateObj.getDay()];

  const classesForSelectedDate = useMemo(() => {
    return classes.filter(c => {
      if (c.date) {
        return c.date === selectedDate;
      }
      if (!currentPeriod || currentPeriod.type === 'break') return false;
      return c.day === selectedDayName;
    }).sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [classes, selectedDayName, currentPeriod, selectedDate]);

  const navigateDate = (daysOffset: number) => {
    const [y, m, dayNum] = selectedDate.split('-').map(Number);
    const d = new Date(y, m - 1, dayNum);
    d.setDate(d.getDate() + daysOffset);
    setSelectedDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans">
      {/* Sidebar / Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 md:top-0 md:bottom-0 md:w-64 bg-white border-t md:border-t-0 md:border-r border-gray-200 z-50">
        <div className="p-6 hidden md:block">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Planner</h1>
          </div>
          
          <div className="space-y-2">
            <button 
              onClick={() => setActiveTab('schedule')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'schedule' ? 'bg-black text-white' : 'hover:bg-gray-100 text-gray-500'}`}
            >
              <CalendarIcon className="w-5 h-5" />
              <span className="font-medium">Daily View</span>
            </button>
            <button 
              onClick={() => setActiveTab('calendar')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'calendar' ? 'bg-black text-white' : 'hover:bg-gray-100 text-gray-500'}`}
            >
              <CalendarIcon className="w-5 h-5" />
              <span className="font-medium">Semester</span>
            </button>
            <button 
              onClick={() => setActiveTab('assignments')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'assignments' ? 'bg-black text-white' : 'hover:bg-gray-100 text-gray-500'}`}
            >
              <CheckSquare className="w-5 h-5" />
              <span className="font-medium">Assignments</span>
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        <div className="flex md:hidden justify-around p-4">
          <button onClick={() => setActiveTab('schedule')} className={`flex flex-col items-center gap-1 ${activeTab === 'schedule' ? 'text-black' : 'text-gray-400'}`}>
            <CalendarIcon className="w-6 h-6" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-center">Daily</span>
          </button>
          <button onClick={() => setActiveTab('calendar')} className={`flex flex-col items-center gap-1 ${activeTab === 'calendar' ? 'text-black' : 'text-gray-400'}`}>
            <CalendarIcon className="w-6 h-6" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-center">Semester</span>
          </button>
          <button onClick={() => setActiveTab('assignments')} className={`flex flex-col items-center gap-1 ${activeTab === 'assignments' ? 'text-black' : 'text-gray-400'}`}>
            <CheckSquare className="w-6 h-6" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-center">Tasks</span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="md:ml-64 p-6 md:p-12 pb-24 md:pb-12">
        <div className="max-w-4xl mx-auto">
          <header className="flex justify-between items-end mb-12">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mb-2">
                {activeTab === 'schedule' ? 'Daily Tracking' : activeTab === 'calendar' ? 'Semester Overview' : 'Tasks'}
              </p>
              <h2 className="text-4xl font-bold tracking-tight">
                {activeTab === 'schedule' ? (
                  <div className="flex items-center gap-4">
                    <button onClick={() => navigateDate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                      <ChevronLeft className="w-8 h-8" />
                    </button>
                    <div className="flex flex-col items-center">
                      <span className="min-w-[200px] text-center">
                        {new Date(selectedDate).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}
                      </span>
                      <button 
                        onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                        className="text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-black transition-colors mt-1"
                      >
                        Jump to Today
                      </button>
                    </div>
                    <button onClick={() => navigateDate(1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                      <ChevronRight className="w-8 h-8" />
                    </button>
                  </div>
                ) : activeTab === 'calendar' ? 'Semester' : 'Assignments'}
              </h2>
            </div>
            {activeTab !== 'calendar' && (
              <button 
                onClick={() => activeTab === 'schedule' ? setIsAddingClass(true) : setIsAddingAssignment(true)}
                className="bg-black text-white p-3 rounded-full hover:scale-110 transition-transform shadow-lg"
              >
                <Plus className="w-6 h-6" />
              </button>
            )}
          </header>

          <AnimatePresence mode="wait">
            {activeTab === 'schedule' ? (
              <motion.div 
                key="schedule"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                {/* Status Banner */}
                <div className={`p-4 rounded-2xl border flex items-center justify-between ${currentPeriod?.type === 'break' ? 'bg-amber-50 border-amber-100 text-amber-900' : 'bg-emerald-50 border-emerald-100 text-emerald-900'}`}>
                  <div className="flex items-center gap-3">
                    {currentPeriod?.type === 'break' ? <Coffee className="w-5 h-5" /> : <GraduationCap className="w-5 h-5" />}
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest opacity-60">{currentPeriod?.name || 'Outside Semester'}</p>
                      <p className="font-bold">{currentPeriod?.type === 'break' ? 'Passover Break - No Classes' : 'Regular Study Day'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => (document.getElementById('date-picker') as HTMLInputElement)?.showPicker()}
                      className="p-2 hover:bg-black/5 rounded-lg transition-colors"
                      title="Select Date"
                    >
                      <CalendarIcon className="w-5 h-5" />
                    </button>
                    <input 
                      id="date-picker"
                      type="date" 
                      value={selectedDate} 
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="bg-white/50 border-none rounded-lg px-2 py-1 text-sm font-bold focus:ring-0 w-[120px]"
                    />
                  </div>
                </div>

                {/* Weekly Ribbon */}
                <div className="relative group">
                  <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar -mx-2 px-2 snap-x">
                    {[-7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7].map(offset => {
                      const [y, m, dayNum] = selectedDate.split('-').map(Number);
                      const d = new Date(y, m - 1, dayNum);
                      d.setDate(d.getDate() + offset);
                      
                      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                      const dayName = days[d.getDay()];
                      const isSelected = dateStr === selectedDate;
                      const isToday = getTodayStr() === dateStr;
                      const period = semesterPeriods.find(p => dateStr >= p.start && dateStr <= p.end);
                      const hasClasses = classes.some(c => c.date === dateStr || (period?.type === 'study' && c.day === dayName));

                      return (
                        <button 
                          key={`${dateStr}-${offset}`}
                          onClick={() => setSelectedDate(dateStr)}
                          className={`flex-shrink-0 w-16 h-24 flex flex-col items-center justify-center rounded-2xl border transition-all snap-center ${
                            isSelected 
                              ? 'bg-black text-white border-black shadow-lg scale-105 z-10' 
                              : isToday 
                                ? 'bg-white border-black text-black' 
                                : 'bg-white border-gray-100 hover:border-gray-300 text-gray-500'
                          }`}
                        >
                          <span className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${isSelected ? 'text-gray-400' : 'text-gray-400'}`}>
                            {dayName.slice(0, 3)}
                          </span>
                          <span className="text-xl font-bold leading-none mb-2">{d.getDate()}</span>
                          <div className={`w-1.5 h-1.5 rounded-full ${hasClasses ? (isSelected ? 'bg-white' : 'bg-black') : 'bg-transparent'}`} />
                        </button>
                      );
                    })}
                  </div>
                  <div className="absolute left-0 top-0 bottom-4 w-8 bg-gradient-to-r from-[#F8F9FA] to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute right-0 top-0 bottom-4 w-8 bg-gradient-to-l from-[#F8F9FA] to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                <div className="space-y-4">
                  {classesForSelectedDate.map(c => {
                    const completed = isClassCompleted(c.id, selectedDate);
                    return (
                      <div 
                        key={c.id}
                        className={`group bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between ${completed ? 'opacity-60' : ''}`}
                      >
                        <div className="flex items-center gap-4">
                          <button 
                            onClick={() => toggleClassInstance(c.id, selectedDate)}
                            className={`transition-colors ${completed ? 'text-emerald-500' : 'text-gray-300 hover:text-black'}`}
                          >
                            {completed ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                          </button>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className={`font-bold text-lg ${completed ? 'line-through text-gray-400' : ''}`}>{c.name}</h4>
                              {c.date && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-gray-100 text-gray-500">
                                  One-off
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                              <span className="flex items-center gap-1.5">
                                <Clock className="w-4 h-4" />
                                {c.startTime} - {c.endTime}
                              </span>
                              {c.room && (
                                <span className="flex items-center gap-1.5">
                                  <MapPin className="w-4 h-4" />
                                  {c.room}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <button 
                          onClick={() => deleteClass(c.id)}
                          className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 transition-all"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    );
                  })}

                  {classesForSelectedDate.length === 0 && (
                    <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
                      {currentPeriod?.type === 'break' ? (
                        <>
                          <Coffee className="w-12 h-12 text-amber-200 mx-auto mb-4" />
                          <p className="text-gray-500 font-medium">Enjoy your break!</p>
                        </>
                      ) : (
                        <>
                          <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500 font-medium">No schedule for this day.</p>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            ) : activeTab === 'calendar' ? (
              <motion.div 
                key="calendar"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="grid gap-6">
                  {semesterPeriods.map(period => {
                    const { progress, daysLeft, status } = getPeriodProgress(period);
                    
                    return (
                      <div key={period.id} className={`p-6 rounded-3xl border ${period.type === 'break' ? 'bg-amber-50 border-amber-100' : 'bg-white border-gray-100'} ${status === 'current' ? 'ring-2 ring-black ring-offset-2' : ''}`}>
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-xl font-bold">{period.name}</h3>
                              {status === 'current' && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-black text-white">
                                  Current
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                              {new Date(period.start).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} - {new Date(period.end).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${period.type === 'break' ? 'bg-amber-200 text-amber-900' : 'bg-emerald-100 text-emerald-900'}`}>
                            {period.type}
                          </span>
                        </div>
                        
                        <div className="mt-4">
                          <div className="flex justify-between text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                            <span>Progress</span>
                            <span>
                              {status === 'completed' ? 'Completed' : 
                               status === 'upcoming' ? `${daysLeft} days total` : 
                               `${daysLeft} days left`}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className={`h-full transition-all duration-1000 ${period.type === 'break' ? 'bg-amber-400' : 'bg-black'} ${status === 'upcoming' ? 'opacity-30' : ''}`} 
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <span className="text-xs font-bold text-gray-400 w-8 text-right">
                              {Math.round(progress)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="bg-black text-white p-8 rounded-3xl">
                  <h3 className="text-2xl font-bold mb-4">Weekly Base Schedule</h3>
                  <p className="text-gray-400 text-sm mb-6">These classes repeat every study week.</p>
                  <div className="space-y-4">
                    {days.map(day => {
                      const dayClasses = classes.filter(c => c.day === day);
                      if (dayClasses.length === 0) return null;
                      return (
                        <div key={day} className="flex items-center justify-between py-2 border-b border-white/10 last:border-0">
                          <span className="font-bold">{day}</span>
                          <span className="text-sm text-gray-400">{dayClasses.length} Classes</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="assignments"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                {[...assignments].sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || '')).map(assignment => (
                  <AssignmentCard 
                    key={assignment.id} 
                    assignment={assignment} 
                    toggleAssignment={toggleAssignment}
                    toggleSubtask={toggleSubtask}
                    deleteAssignment={deleteAssignment}
                  />
                ))}

                {assignments.length === 0 && (
                  <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
                    <CheckSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">No assignments yet.</p>
                    <button 
                      onClick={() => setIsAddingAssignment(true)}
                      className="mt-4 text-sm font-bold text-black hover:underline"
                    >
                      Add a task
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Modals */}
      <AnimatePresence>
        {(isAddingClass || isAddingAssignment) && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <h3 className="text-2xl font-bold mb-6">
                  {isAddingClass ? 'Add to Schedule' : 'Add Assignment'}
                </h3>
                
                {isAddingClass ? (
                  <form onSubmit={addClass} className="space-y-4">
                    <div className="flex bg-gray-100 p-1 rounded-xl mb-4">
                      <button
                        type="button"
                        onClick={() => setIsOneOffTask(false)}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${!isOneOffTask ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-black'}`}
                      >
                        Weekly Class
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsOneOffTask(true)}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${isOneOffTask ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-black'}`}
                      >
                        Specific Day
                      </button>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">
                        {isOneOffTask ? 'Task / Event Name' : 'Class Name'}
                      </label>
                      <input required name="name" type="text" placeholder={isOneOffTask ? "e.g. Doctor Appointment" : "e.g. Advanced Calculus"} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 focus:outline-none focus:ring-2 focus:ring-black transition-all" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        {isOneOffTask ? (
                          <>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Date</label>
                            <input required name="date" type="date" defaultValue={selectedDate} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 focus:outline-none focus:ring-2 focus:ring-black transition-all" />
                          </>
                        ) : (
                          <>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Day</label>
                            <select name="day" defaultValue={selectedDayName} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 focus:outline-none focus:ring-2 focus:ring-black transition-all">
                              {days.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                          </>
                        )}
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Location (Optional)</label>
                        <input name="room" type="text" placeholder="e.g. Hall B" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 focus:outline-none focus:ring-2 focus:ring-black transition-all" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Start Time</label>
                        <input required name="startTime" type="time" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 focus:outline-none focus:ring-2 focus:ring-black transition-all" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">End Time</label>
                        <input required name="endTime" type="time" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 focus:outline-none focus:ring-2 focus:ring-black transition-all" />
                      </div>
                    </div>
                    <div className="flex gap-3 pt-4">
                      <button type="button" onClick={() => setIsAddingClass(false)} className="flex-1 px-4 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-all">Cancel</button>
                      <button type="submit" className="flex-1 px-4 py-3 rounded-xl font-bold bg-black text-white hover:bg-gray-800 transition-all">Save Class</button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={addAssignment} className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Assignment Title</label>
                      <input required name="title" type="text" placeholder="e.g. Research Paper" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 focus:outline-none focus:ring-2 focus:ring-black transition-all" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Subject</label>
                      <input required name="subject" type="text" placeholder="e.g. History" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 focus:outline-none focus:ring-2 focus:ring-black transition-all" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Due Date</label>
                      <input required name="dueDate" type="date" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 focus:outline-none focus:ring-2 focus:ring-black transition-all" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Details (Optional)</label>
                      <textarea name="details" rows={3} placeholder="Add more context..." className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 focus:outline-none focus:ring-2 focus:ring-black transition-all resize-none" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Subtasks (One per line)</label>
                      <textarea name="subtasks" rows={3} placeholder="e.g. Find sources&#10;Write draft&#10;Proofread" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 focus:outline-none focus:ring-2 focus:ring-black transition-all resize-none" />
                    </div>
                    <div className="flex gap-3 pt-4">
                      <button type="button" onClick={() => setIsAddingAssignment(false)} className="flex-1 px-4 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-all">Cancel</button>
                      <button type="submit" className="flex-1 px-4 py-3 rounded-xl font-bold bg-black text-white hover:bg-gray-800 transition-all">Save Task</button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface AssignmentCardProps {
  key?: React.Key;
  assignment: Assignment;
  toggleAssignment: (id: string) => void;
  toggleSubtask: (assignmentId: string, subtaskId: string) => void;
  deleteAssignment: (id: string) => void;
}

function AssignmentCard({ assignment, toggleAssignment, toggleSubtask, deleteAssignment }: AssignmentCardProps) {
  const a = assignment;
  const hasExtras = (a.details && a.details.trim()) || (a.subtasks && a.subtasks.length > 0);
  const [isExpanded, setIsExpanded] = useState(false);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'No date';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return 'Invalid date';
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <div 
      className={`group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden ${a.completed ? 'opacity-60' : ''}`}
    >
      <div className="p-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => toggleAssignment(a.id)}
            className={`transition-colors ${a.completed ? 'text-emerald-500' : 'text-gray-300 hover:text-black'}`}
          >
            {a.completed ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                {a.subject}
              </span>
            </div>
            <h4 className={`font-bold text-lg ${a.completed ? 'line-through text-gray-400' : ''}`}>{a.title}</h4>
            <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
              <CalendarIcon className="w-4 h-4" />
              Due: {formatDate(a.dueDate)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasExtras && (
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 text-gray-400 hover:text-black transition-colors"
            >
              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          )}
          <button 
            onClick={() => deleteAssignment(a.id)}
            className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 transition-all"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-gray-50 bg-gray-50/50"
          >
            <div className="p-5 pt-0 space-y-4">
              {a.details && (
                <div className="mt-4">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                    <AlignLeft className="w-3 h-3" />
                    Details
                  </div>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
                    {a.details}
                  </p>
                </div>
              )}
              
              {a.subtasks && a.subtasks.length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                    <ListTodo className="w-3 h-3" />
                    Subtasks
                  </div>
                  <div className="space-y-2">
                    {a.subtasks.map(s => (
                      <button 
                        key={s.id}
                        onClick={() => toggleSubtask(a.id, s.id)}
                        className="flex items-center gap-3 w-full text-left group/sub"
                      >
                        {s.completed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Circle className="w-4 h-4 text-gray-300 group-hover/sub:text-gray-400" />
                        )}
                        <span className={`text-sm ${s.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                          {s.text}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
