import React from 'react';
import { Calendar, Clock } from 'lucide-react';

const StudentTimetable = ({ timetable, timetableLoading }) => {
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  // Handle null, undefined, or object timetable data
  const timetableSchedule = Array.isArray(timetable) ? timetable : 
                            timetable?.schedule ? timetable.schedule : [];

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-900 mb-6">Timetable</h1>
      {timetableLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-slate-600 mt-4">Loading timetable...</p>
        </div>
      ) : timetableSchedule.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center border border-slate-100">
          <Calendar className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600 text-lg">No timetable available</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-slate-100">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
            {daysOfWeek.map((day) => {
              const daySchedule = timetableSchedule.filter(item => item.day === day);
              
              return (
                <div key={day} className="border border-slate-200 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-slate-900 mb-3">{day}</h3>
                  {daySchedule.length === 0 ? (
                    <p className="text-sm text-slate-500">No classes</p>
                  ) : (
                    <div className="space-y-2">
                      {daySchedule.map((item) => (
                        <div key={item._id} className="bg-blue-50 p-3 rounded-lg">
                          <p className="font-semibold text-sm text-slate-900">
                            {item.courseId?.name || item.subject}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Clock className="w-3 h-3 text-slate-600" />
                            <p className="text-xs text-slate-600">
                              {item.startTime} - {item.endTime}
                            </p>
                          </div>
                          {item.room && (
                            <p className="text-xs text-slate-600 mt-1">Room: {item.room}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentTimetable;
