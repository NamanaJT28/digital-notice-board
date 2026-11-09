import { iconFor, formatDate, expiryLabel, daysLeft, statusOf, fmtSize } from "../utils";
import { downloadFile } from "../api";

export default function NoticeCard({ notice, actions, showSender }) {
  const d = daysLeft(notice.expiryDate);
  const status = statusOf(notice);
  const badgeClass = d < 0 ? "badge-red" : d <= 3 ? "badge-orange" : "badge-green";
  const roleName = { admin: "Principal", hod: "HOD", teacher: "Teacher" };
  const sems = notice.semesters?.length ? `Sem ${notice.semesters.join(", ")}` : "All semesters";
  const dept = notice.isCollegeWide ? "College-wide" : notice.departments.map((x) => x.code).join(", ");

  return (
    <article className="card notice">
      <div className="notice-head">
        <span className="cat-icon">{iconFor(notice.category)}</span>
        <div className="notice-title">
          <h3>{notice.title}</h3>
          <span className="muted">{notice.category} · {dept} · {sems}</span>
        </div>
        <span className={`badge ${badgeClass}`}>{expiryLabel(notice.expiryDate)}</span>
      </div>
      <p className="desc">{notice.description}</p>
      <div className="notice-meta">
        <span>Published: {formatDate(notice.publishDate)}</span>
        <span>Expires: {formatDate(notice.expiryDate)}</span>
        {showSender && notice.createdBy && (
          <span>From: {notice.createdBy.name} ({roleName[notice.createdBy.role] || notice.createdBy.role})</span>
        )}
        {status !== "active" && <span className={`status status-${status}`}>{status}</span>}
      </div>
      {notice.attachments?.length > 0 && (
        <div className="attach-list">
          {notice.attachments.map((a) => (
            <button key={a.file} type="button" className="attach" onClick={() => downloadFile(a).catch(() => alert("Could not download the file"))}>
              📎 {a.name} <span className="muted">({fmtSize(a.size)})</span>
            </button>
          ))}
        </div>
      )}
      <div className="notice-foot">
        {notice.registrationLink && (
          <a className="btn btn-primary" href={notice.registrationLink} target="_blank" rel="noreferrer">Register</a>
        )}
        {actions}
      </div>
    </article>
  );
}
