import { useMemo } from 'react';

const draftProspects = [
  { pick: 1, name: "AJ Dybantsa", school: "BYU", pos: "SF", yr: "Fr", age: 18, ht: '6\'9"', wt: "215", wingspan: '6\'11"', ppg: 24.9, rpg: 7.1, apg: 4.0, fg: 53.3, tsp: 58.1, team: "Washington Wizards", teamNeed: "Star wing scorer to build around", nbaComp: "Paul George / Jimmy Butler", analysis: "Dybantsa is the most physically imposing wing in this class. Washington desperately needs a franchise cornerstone after missing on Flagg — Dybantsa's elite scoring (25 PPG), improving 3PT shot, and defensive versatility make him the perfect fit.", tier: "Franchise", tierColor: "var(--accent)" },
  { pick: 2, name: "Darryn Peterson", school: "Kansas", pos: "PG/SG", yr: "Fr", age: 18, ht: '6\'5"', wt: "205", wingspan: '6\'10.5"', ppg: 19.7, rpg: 3.5, apg: 3.0, fg: 48.2, tsp: 60.1, team: "Indiana Pacers", teamNeed: "Elite shot-creating guard", nbaComp: "Devin Booker / Paul George", analysis: "Peterson is a three-level scorer with elite athleticism and defensive upside. Indiana needs a guard who can create his own shot alongside Tyrese Haliburton.", tier: "Franchise", tierColor: "var(--accent)" },
  { pick: 3, name: "Cameron Boozer", school: "Duke", pos: "PF/C", yr: "Fr", age: 18, ht: '6\'9"', wt: "240", wingspan: '7\'0"', ppg: 22.7, rpg: 10.3, apg: 4.3, fg: 58.3, tsp: 64.2, team: "Atlanta Hawks", teamNeed: "Frontcourt anchor and offensive hub", nbaComp: "Bam Adebayo / Karl-Anthony Towns", analysis: "The most polished prospect in the class. Atlanta needs a frontcourt centerpiece after years of rebuilding — Boozer's 58% FG, 40% 3PT, elite rebounding and playmaking at 6'9\" is exactly what contenders are built around.", tier: "Franchise", tierColor: "var(--accent)" },
  { pick: 4, name: "Nate Ament", school: "Tennessee", pos: "SF/PF", yr: "Fr", age: 18, ht: '6\'8"', wt: "210", wingspan: '7\'1"', ppg: 16.2, rpg: 7.8, apg: 3.2, fg: 51.4, tsp: 60.8, team: "Charlotte Hornets", teamNeed: "Versatile two-way wing", nbaComp: "Scottie Barnes / OG Anunoby", analysis: "Ament is a do-everything wing with elite length and defensive versatility. Charlotte needs two-way impact players to build around LaMelo Ball.", tier: "Star", tierColor: "var(--blue)" },
  { pick: 5, name: "Caleb Wilson", school: "Utah", pos: "SF/PF", yr: "Fr", age: 18, ht: '6\'8"', wt: "205", wingspan: '7\'0"', ppg: 18.4, rpg: 8.2, apg: 4.1, fg: 52.1, tsp: 61.2, team: "New Orleans Pelicans", teamNeed: "Athletic wing scorer", nbaComp: "Jaren Jackson Jr. / Jonathan Kuminga", analysis: "Wilson has been one of the most explosive performers of the season. His athleticity is elite, and his improving shot-making and post-up efficiency show he's more than just a dunker.", tier: "Star", tierColor: "var(--blue)" },
];

export default function DraftBoard({ posFilter, roundFilter }) {
  const filtered = useMemo(() => {
    let prospects = [...draftProspects];
    if (posFilter && posFilter !== '') {
      prospects = prospects.filter(p => p.pos.includes(posFilter));
    }
    if (roundFilter === 'lottery') {
      prospects = prospects.filter(p => p.pick <= 14);
    } else if (roundFilter === 'first') {
      prospects = prospects.filter(p => p.pick <= 30);
    }
    return prospects;
  }, [posFilter, roundFilter]);

  return (
    <div className="section">
      <div className="page-title">
        <div>
          <h1>🏀 2026 NBA Draft Board</h1>
          <p>Top prospects ranked by draft position · Includes team fit analysis · Updated March 2026</p>
        </div>
      </div>

      <div style={{
        background: 'white',
        border: '1px solid var(--border)',
        borderRadius: '6px',
        padding: '16px 20px',
        marginBottom: '20px',
        fontSize: '13px',
        color: 'var(--text-secondary)',
        lineHeight: '1.8'
      }}>
        <strong style={{ color: 'var(--text-primary)' }}>About this board:</strong> The 2026 NBA Draft is widely considered one of the deepest in years. The top three — <strong>AJ Dybantsa</strong>, <strong>Darryn Peterson</strong>, and <strong>Cameron Boozer</strong> — are all legitimate No. 1 pick candidates with franchise-altering upside.
      </div>

      <div>
        {filtered.map(p => (
          <div key={p.pick} style={{
            background: 'white',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            marginBottom: '12px',
            overflow: 'hidden',
            display: 'grid',
            gridTemplateColumns: '60px 1fr',
          }}>
            <div style={{
              background: p.tierColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              padding: '16px 8px',
              minWidth: '60px',
              color: 'white'
            }}>
              <div style={{
                fontSize: '10px',
                opacity: 0.9,
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.4px'
              }}>Pick</div>
              <div style={{
                fontSize: '28px',
                fontWeight: '900',
                fontFamily: 'var(--font-serif)',
                lineHeight: '1'
              }}>{p.pick}</div>
            </div>

            <div style={{ padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', fontWeight: '600' }}>
                  {p.name}
                </span>
                <span className="pill pill-blue">{p.pos}</span>
                <span className="pill pill-amber">{p.school}</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {p.ht} · {p.wt} lbs · Age {p.age}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px', marginBottom: '10px' }}>
                {[
                  ['PPG', p.ppg.toFixed(1)],
                  ['RPG', p.rpg.toFixed(1)],
                  ['APG', p.apg.toFixed(1)],
                  ['FG%', p.fg + '%'],
                  ['TS%', p.tsp + '%'],
                  ['Wingspan', p.wingspan]
                ].map(([l, v]) => (
                  <div key={l} style={{ background: 'var(--bg)', borderRadius: '3px', padding: '6px 8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.4px', color: 'var(--text-muted)', fontWeight: '700' }}>
                      {l}
                    </div>
                    <div style={{ fontWeight: '700', fontSize: '13px', marginTop: '2px' }}>{v}</div>
                  </div>
                ))}
              </div>

              <div style={{
                background: 'var(--blue-light)',
                borderRadius: '4px',
                padding: '10px 12px',
                marginBottom: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.4px', color: 'var(--blue)' }}>
                    → {p.team}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Need: {p.teamNeed}</span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                  {p.analysis}
                </div>
              </div>

              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                NBA Comp: <strong style={{ color: 'var(--text-secondary)' }}>{p.nbaComp}</strong> · <span style={{ color: p.tierColor, fontWeight: '700' }}>{p.tier} Projection</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="data-note">
        Sources: ESPN, CBS Sports, Bleacher Report, Babcock Hoops · Team needs based on current standings · March 2026
      </p>
    </div>
  );
}
