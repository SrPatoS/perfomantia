import fs from 'fs';

const p = 'd:\\my-repos\\perfomantia\\webapp\\src\\Settings.tsx';
let txt = fs.readFileSync(p, 'utf-8');

// Add select State
txt = txt.replace(/const \[dbUri, setDbUri\] = useState\(''\);/, "const [dbUri, setDbUri] = useState('');\n  const [openSelect, setOpenSelect] = useState(false);");

// Replace `<select>` node
const searchUi = `<select value={dbType} onChange={e => setDbType(e.target.value)} style={{ ...inputStyle, width: '150px', background: 'rgba(0,0,0,0.5)', cursor: 'pointer' }}>
                 <option value="mongo">MongoDB</option>
                 <option value="postgres">PostgreSql</option>
              </select>`;

const replaceUi = `<div style={{ position: 'relative', width: '150px' }}>
                 <div style={{ ...inputStyle, width: '100%', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.3)' }} onClick={() => setOpenSelect(!openSelect)}>
                    <span>{dbType === 'mongo' ? 'MongoDB' : 'PostgreSQL'}</span>
                    <span style={{ fontSize: '0.6rem', opacity: 0.5 }}>▼</span>
                 </div>
                 {openSelect && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'rgba(15,23,36,0.98)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', zIndex: 10, marginTop: '0.4rem', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', overflow: 'hidden' }}>
                       <div 
                         style={{ padding: '0.6rem 1rem', cursor: 'pointer', color: dbType === 'mongo' ? 'var(--accent-color)' : '#e2e8f0', background: 'transparent', transition: 'background 0.2s', fontSize: '0.85rem' }} 
                         onClick={() => { setDbType('mongo'); setOpenSelect(false); }}
                         onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                         onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                       >
                         MongoDB
                       </div>
                       <div 
                         style={{ padding: '0.6rem 1rem', cursor: 'pointer', color: dbType === 'postgres' ? 'var(--accent-color)' : '#e2e8f0', background: 'transparent', transition: 'background 0.2s', borderTop: '1px solid rgba(255,255,255,0.03)', fontSize: '0.85rem' }} 
                         onClick={() => { setDbType('postgres'); setOpenSelect(false); }}
                         onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                         onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                       >
                         PostgreSQL
                       </div>
                    </div>
                 )}
              </div>`;

txt = txt.replace(searchUi, replaceUi);

fs.writeFileSync(p, txt, 'utf-8');
console.log("✅ SELECT DONE");
