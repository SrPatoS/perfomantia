import fs from 'fs';

const p = 'd:\\my-repos\\perfomantia\\webapp\\src\\Settings.tsx';
let txt = fs.readFileSync(p, 'utf-8');

// 1. Remove single Mongo State
txt = txt.replace(/const \[mongoUri, setMongoUri\] = useState\(''\);/, `const [databases, setDatabases] = useState<any[]>([]);
  const [dbName, setDbName] = useState('');
  const [dbType, setDbType] = useState('mongo');
  const [dbUri, setDbUri] = useState('');`);

// 2. Remove useEffect hook mongo_uri
txt = txt.replace(/setMongoUri\(d\.mongo_uri \|\| ''\);/, "");

// 3. Add databases loads
txt = txt.replace(/useEffect\(\(\) => \{/, `const loadDatabases = () => {
     api.get('/settings/databases').then(r => setDatabases(r.data || [])).catch(console.error);
  };

  useEffect(() => {
     loadDatabases();`);

// 4. Add DB actions
txt = txt.replace(/const handleSaveAlerts = async \(\) => \{/, `const handleAddDb = async () => {
     if (!dbName || !dbUri) return showToast('Preencha os campos!', 'error');
     try {
        await api.post('/settings/databases', { name: dbName, type: dbType, uri: dbUri });
        setDbName(''); setDbUri('');
        showToast('Banco adicionado!');
        loadDatabases();
     } catch(e) { showToast('Erro ao adicionar.', 'error'); }
  };

  const handleDeleteDb = async (id: number) => {
     try {
        await api.delete('/settings/databases/' + id);
        showToast('Banco removido!');
        loadDatabases();
     } catch(e) {}
  };

  const handleSaveAlerts = async () => {`);

// 5. Replace card UI
const searchUi = `      <div style={cardStyle}>
        <div style={headerStyle}>
           <h3 style={{ fontSize: '1.25rem', fontWeight: 500, color: '#fff', margin: 0 }}>Bancos de Dados</h3>
        </div>
        <div style={bodyStyle}>
           <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>MongoDB Connection String</label>
              <input type="text" placeholder="mongodb://localhost:27017" value={mongoUri} onChange={e => setMongoUri(e.target.value)} style={{ ...inputStyle, maxWidth: 'none' }} />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.6rem', display: 'block' }}>Será coletado: conexões, opcounters (queries/sec), e memória alocada.</span>
           </div>
        </div>
        <div style={footerStyle}>
           <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Configurar monitoramento interno do MongoDB.</span>
           <Button onClick={handleSaveAlerts}>Salvar Banco</Button>
        </div>
      </div>`;

const replaceUi = `      <div style={cardStyle}>
        <div style={headerStyle}>
           <h3 style={{ fontSize: '1.25rem', fontWeight: 500, color: '#fff', margin: 0 }}>Bancos de Dados</h3>
        </div>
        <div style={bodyStyle}>
           <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              <input type="text" placeholder="Nome (Ex: Mongo Produção)" value={dbName} onChange={e => setDbName(e.target.value)} style={{ ...inputStyle, width: '200px' }} />
              <select value={dbType} onChange={e => setDbType(e.target.value)} style={{ ...inputStyle, width: '150px', background: 'rgba(0,0,0,0.5)', cursor: 'pointer' }}>
                 <option value="mongo">MongoDB</option>
                 <option value="postgres">PostgreSql</option>
              </select>
              <input type="text" placeholder="Connection String (URI)" value={dbUri} onChange={e => setDbUri(e.target.value)} style={{ ...inputStyle, flex: 1, minWidth: '250px' }} />
              <Button onClick={handleAddDb}>+ Adicionar</Button>
           </div>

           {databases.length > 0 && (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                 <thead>
                    <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                       <th style={{ padding: '0.5rem', textAlign: 'left' }}>Nome</th>
                       <th style={{ padding: '0.5rem', textAlign: 'left' }}>Tipo</th>
                       <th style={{ padding: '0.5rem', textAlign: 'left' }}>URL</th>
                       <th style={{ padding: '0.5rem', textAlign: 'right' }}>Ações</th>
                    </tr>
                 </thead>
                 <tbody>
                    {databases.map((d: any) => (
                       <tr key={d.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                          <td style={{ padding: '0.75rem 0.5rem', color: '#fff' }}>{d.name}</td>
                          <td style={{ padding: '0.75rem 0.5rem', color: d.type === 'mongo' ? '#10b981' : '#0ea5e9', fontWeight: 500 }}>{d.type.toUpperCase()}</td>
                          <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>{d.uri.includes('@') ? '***@' + d.uri.split('@')[1] : d.uri.substring(0,25) + '...'}</td>
                          <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>
                             <button onClick={() => handleDeleteDb(d.id)} style={{ padding: '0.3rem 0.5rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }}>Excluir</button>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           )}
        </div>
      </div>`;

if (txt.indexOf(searchUi) !== -1) {
    txt = txt.replace(searchUi, replaceUi);
} else {
    console.log("❌ UI SEARCH FAIL");
}

fs.writeFileSync(p, txt, 'utf-8');
console.log("✅ MULTI DB DONE");
