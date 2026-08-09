const TEAM = [
  {
    name: 'Aditya Jadhav',
    initials: 'AJ',
    role: 'Team lead · Architecture',
    detail:
      'Owns product direction, the image engine, integration, deployment and the final release.',
    linkedin: 'https://www.linkedin.com/in/jadhavaaditya/',
    linkLabel: 'Aditya on LinkedIn',
  },
  {
    name: 'Nitin Gupta',
    initials: 'NG',
    role: 'Frontend engineering',
    detail:
      'Builds the fast, accessible browser experience—from upload and editing to sharing.',
    linkedin: 'https://www.linkedin.com/in/nitin-gupta-4a1681338/',
    linkLabel: 'Nitin on LinkedIn',
  },
  {
    name: 'Lavitra Satam',
    initials: 'LS',
    role: 'Product design · Visual QA',
    detail:
      'Shapes the brand system, interaction design, export templates and final visual polish.',
    linkedin: 'https://www.linkedin.com/search/results/people/?keywords=Lavitra%20Satam',
    linkLabel: 'Find Lavitra on LinkedIn',
  },
] as const

function LinkedInIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M6.5 8.1H3.2V19h3.3V8.1ZM4.8 3A1.9 1.9 0 1 0 4.8 6.8 1.9 1.9 0 0 0 4.8 3ZM20.8 12.7c0-3.3-1.8-4.9-4.2-4.9a3.7 3.7 0 0 0-3.3 1.8V8.1H10V19h3.3v-5.4c0-1.4.3-2.8 2.1-2.8 1.8 0 1.8 1.7 1.8 2.9V19h3.4l.2-6.3Z"
      />
    </svg>
  )
}

export function AboutUs() {
  return (
    <section id="about-us" className="about-section" aria-labelledby="about-title">
      <div className="about-shell">
        <div className="about-intro">
          <p className="about-kicker">03 builders · one studio</p>
          <h2 id="about-title" className="about-title">
            Meet <span>GoaByte</span>
          </h2>
          <p className="about-copy">
            We are a small product team combining engineering, design and image technology
            to turn one photo into something people are excited to post. Builder Studio
            was made for the Hacker House Goa 2026 open trial—and every image stays
            private on your device.
          </p>
        </div>

        <div className="about-team" aria-label="GoaByte team members">
          {TEAM.map((member, index) => (
            <article className="team-card" key={member.name}>
              <div className="team-card-topline">
                <span className="team-index">0{index + 1}</span>
                <span className="team-avatar" aria-hidden="true">
                  {member.initials}
                </span>
              </div>

              <div>
                <h3>{member.name}</h3>
                <p className="team-role">{member.role}</p>
                <p className="team-detail">{member.detail}</p>
              </div>

              <a
                href={member.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={member.linkLabel}
                className="team-linkedin"
              >
                <LinkedInIcon />
                LinkedIn
                <span aria-hidden="true">↗</span>
              </a>
            </article>
          ))}
        </div>

        <p className="about-disclaimer">
          Independent project by team GoaByte · Not an official Hacker House Goa product
        </p>
      </div>
    </section>
  )
}
