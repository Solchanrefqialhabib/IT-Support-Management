export default function PageHeader({ eyebrow = 'OPERASIONAL IT', title, description, action }) {
  return <div className="page-header"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1>{description && <p>{description}</p>}</div>{action}</div>
}
