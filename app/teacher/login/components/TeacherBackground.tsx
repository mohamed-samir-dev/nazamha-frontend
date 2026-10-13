export default function TeacherBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -top-48 -right-48 h-96 w-96 rounded-full bg-teal-500/10 blur-3xl" />
      <div className="absolute -bottom-48 -left-48 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(20,184,166,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(20,184,166,0.03)_1px,transparent_1px)] bg-[size:48px_48px]" />
    </div>
  );
}
