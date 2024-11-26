import UserProfile from './UserProfile';

export default function Header() {
  return (
    <div className="w-full bg-gradient-to-r from-slate-50 to-slate-100 border-b">
      <div className="container mx-auto py-4">
        <div className="flex items-center justify-between">
          <div className="flex-1" /> {/* Пустой div для центрирования */}
          <h1 className="text-center font-serif flex-1">
            <span className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-600 to-slate-900">
              Mindsetr
            </span>
            <span className="text-xl text-slate-400 ml-2 font-light">
              Mood Tracker
            </span>
          </h1>
          <div className="flex-1 flex justify-end">
            <UserProfile />
          </div>
        </div>
      </div>
    </div>
  );
} 