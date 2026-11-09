// Shared layout for the Login and Register pages: a pinboard on the left, the form on the right.
export default function AuthShell({ children }) {
  const college = import.meta.env.VITE_COLLEGE_NAME || "Your College";
  return (
    <div className="auth">
      <aside className="auth-board">
        <div className="auth-brand"><span aria-hidden="true">📋</span> {college}</div>
        <h2>Every college notice, in one place</h2>
        <p>Principal, HOD and teacher announcements reach the right department the moment they are posted.</p>

        <div className="pins" aria-hidden="true">
          <div className="pin-card pin-1">
            <strong>Internal exam timetable released</strong>
            <div className="pin-meta"><span>Computer Science</span><span className="badge badge-green">5 days left</span></div>
          </div>
          <div className="pin-card pin-2">
            <strong>Hackathon registration closes Friday</strong>
            <div className="pin-meta"><span>College-wide</span><span className="badge badge-orange">2 days left</span></div>
          </div>
          <div className="pin-card pin-3">
            <strong>Library closed this Saturday</strong>
            <div className="pin-meta"><span>College-wide</span><span className="badge badge-green">6 days left</span></div>
          </div>
        </div>
      </aside>
      <main className="auth-panel">{children}</main>
    </div>
  );
}
