import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    query, 
    where, 
    getDocs, 
    limit 
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAeFCIdG1sgY1Rjhlv4LuaGjZstUBNR7lY",
    authDomain: "nutriii.firebaseapp.com",
    projectId: "nutriii",
    storageBucket: "nutriii.firebasestorage.app",
    messagingSenderId: "83480850649",
    appId: "1:83480850649:web:b871de221f58359f578ec8"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- CÁLCULO DE IMC ---
const calcularIMC = (p, t) => (p > 0 && t > 0) ? (p / (t * t)).toFixed(2) : "0.00";

// --- REGISTRO INICIAL (registro.html) ---
const registroForm = document.getElementById('registroForm');
if (registroForm) {
    registroForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const peso = parseFloat(document.getElementById('peso').value);
        const talla = parseFloat(document.getElementById('talla').value);
        
        const datos = {
            nombre: document.getElementById('nombre').value,
            dni: document.getElementById('dni').value,
            jerarquia: document.getElementById('jerarquia').value,
            ce: document.getElementById('ce').value,
            fechaNac: document.getElementById('fechaNac').value,
            telefono: document.getElementById('telefono').value,
            peso, talla,
            musculo: document.getElementById('musculo').value,
            grasa: document.getElementById('grasa').value,
            osea: document.getElementById('osea').value,
            agua: document.getElementById('agua').value,
            imc: calcularIMC(peso, talla),
            novedades: document.getElementById('novedades').value,
            fechaRegistro: new Date().toISOString()
        };

        try {
            await addDoc(collection(db, "pacientes"), datos);
            alert("✅ Personal registrado con éxito.");
            registroForm.reset();
        } catch (error) { alert("Error al registrar."); }
    });
}

// --- BUSCADOR Y GUARDADO DE HISTORIAL (ficha.html) ---
const btnBuscar = document.getElementById('btnBuscar');
const formEdicion = document.getElementById('formEdicion');

if (btnBuscar) {
    btnBuscar.addEventListener('click', async () => {
        const dni = document.getElementById('busquedaDNI').value;
        if (!dni) return alert("Ingrese un DNI");

        const q = query(collection(db, "pacientes"), where("dni", "==", dni));

        try {
            const snap = await getDocs(q);

            if (!snap.empty) {
                const docs = snap.docs.map(d => d.data());
                // Ordenar por fecha para traer la medición más reciente
                docs.sort((a, b) => new Date(b.fechaRegistro) - new Date(a.fechaRegistro));
                
                const data = docs[0]; 

                formEdicion.style.display = 'block';
                document.getElementById('nombreTitulo').innerText = data.nombre;
                document.getElementById('nombre').value = data.nombre;
                document.getElementById('dni').value = data.dni;
                document.getElementById('jerarquia').value = data.jerarquia;
                
                // RELLENO DE CAMPOS INCLUYENDO CE Y TELÉFONO
                if(document.getElementById('ce')) document.getElementById('ce').value = data.ce || '';
                if(document.getElementById('telefono')) document.getElementById('telefono').value = data.telefono || '';
                
                document.getElementById('peso').value = data.peso;
                document.getElementById('talla').value = data.talla;
                document.getElementById('musculo').value = data.musculo;
                document.getElementById('grasa').value = data.grasa;
                document.getElementById('osea').value = data.osea;
                document.getElementById('agua').value = data.agua;
                document.getElementById('valIMC').innerText = data.imc;
            } else { 
                alert("No se encontró personal con ese DNI."); 
            }
        } catch (error) {
            console.error("Error al buscar:", error);
            alert("Error al filtrar en la base de datos.");
        }
    });
}

if (formEdicion) {
    formEdicion.addEventListener('submit', async (e) => {
        e.preventDefault();
        const peso = parseFloat(document.getElementById('peso').value);
        const talla = parseFloat(document.getElementById('talla').value);

        const nuevaMedicion = {
            nombre: document.getElementById('nombre').value,
            dni: document.getElementById('dni').value,
            jerarquia: document.getElementById('jerarquia').value,
            ce: document.getElementById('ce').value, 
            telefono: document.getElementById('telefono').value,
            peso, talla,
            musculo: document.getElementById('musculo').value,
            grasa: document.getElementById('grasa').value,
            osea: document.getElementById('osea').value,
            agua: document.getElementById('agua').value,
            imc: calcularIMC(peso, talla),
            novedades: document.getElementById('novedades').value,
            fechaRegistro: new Date().toISOString()
        };

        try {
            await addDoc(collection(db, "pacientes"), nuevaMedicion);
            alert("✅ Nueva medición guardada en el historial.");
        } catch (error) { alert("Error al guardar historial."); }
    });
}

document.getElementById('btnVerHistorial')?.addEventListener('click', () => {
    const dni = document.getElementById('dni').value;
    window.location.href = `historial.html?dni=${dni}`;
});

// --- RENDERIZAR HISTORIAL (historial.html) ---
if (window.location.pathname.includes('historial.html')) {
    const params = new URLSearchParams(window.location.search);
    const dni = params.get('dni');

    const cargarHistorial = async () => {
        const q = query(collection(db, "pacientes"), where("dni", "==", dni));
        
        try {
            const snap = await getDocs(q);
            const container = document.getElementById('listaHistorial');
            container.innerHTML = "";

            if(snap.empty) { container.innerHTML = "<p>No hay antecedentes.</p>"; return; }

            // Ordenamos: más reciente arriba
            const registros = snap.docs.map(d => d.data());
            registros.sort((a, b) => new Date(b.fechaRegistro) - new Date(a.fechaRegistro));

            // ASIGNACIÓN DE DATOS A LA CABECERA
            const dataPrincipal = registros[0];
            document.getElementById('nombrePaciente').innerText = dataPrincipal.nombre;
            document.getElementById('dniPaciente').innerText = dataPrincipal.dni;
            document.getElementById('cePaciente').innerText = dataPrincipal.ce || "No registrado";

            registros.forEach(reg => {
                const fecha = new Date(reg.fechaRegistro).toLocaleDateString();
                container.innerHTML += `
                    <div class="card" style="text-align: left; margin-bottom: 15px; border-left: 5px solid var(--secondary);">
                        <div style="display:flex; justify-content:space-between;">
                            <strong>Fecha: ${fecha}</strong>
                            <span class="badge">IMC: ${reg.imc}</span>
                        </div>
                        <hr>
                        <p><strong>Peso:</strong> ${reg.peso}kg | <strong>Talla:</strong> ${reg.talla}m</p>
                        <p><strong>Composición:</strong> Mus: ${reg.musculo}% | Gra: ${reg.grasa}kg | Masa Ósea: ${reg.osea}% | Agua Corporal: ${reg.agua}%</p>
                        <p><strong>Observaciones:</strong> ${reg.novedades || 'Sin novedades'}</p>
                    </div>
                `;
            });
        } catch (error) { console.error("Error al cargar historial:", error); }
    };
    cargarHistorial();
}

// --- LÓGICA DE ESTADÍSTICAS (estadistica.html) ---
if (window.location.pathname.includes('estadistica.html')) {
    let charts = {};
    const btnDescargarCombinado = document.getElementById('btnDescargarReporteCombinado');

    const crearGrafico = (id, label, datos, fechas, color) => {
        const canvas = document.getElementById(id);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (charts[id]) charts[id].destroy();

        charts[id] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: fechas,
                datasets: [{
                    label: label,
                    data: datos,
                    borderColor: color,
                    backgroundColor: color + '22',
                    tension: 0.4,
                    fill: true,
                    pointRadius: 4
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    };

    const cargarEvolucionIndividual = async () => {
        const dni = document.getElementById('busquedaDNI').value;
        if (!dni) return alert("Por favor, ingrese un DNI");

        const q = query(collection(db, "pacientes"), where("dni", "==", dni));

        try {
            const snap = await getDocs(q);
            if (snap.empty) {
                if(btnDescargarCombinado) btnDescargarCombinado.style.display = 'none';
                return alert("No se encontraron registros.");
            }

            const registros = snap.docs.map(d => d.data());
            registros.sort((a, b) => new Date(a.fechaRegistro) - new Date(b.fechaRegistro));

            document.getElementById('nombrePacienteEvolucion').innerText = `Paciente: ${registros[0].nombre}`;
            const etiquetas = registros.map(r => new Date(r.fechaRegistro).toLocaleDateString());
            
            crearGrafico('chartAgua', '% Agua Corporal', registros.map(r => r.agua), etiquetas, '#3498db');
            crearGrafico('chartGrasa', '% Grasa', registros.map(r => r.grasa), etiquetas, '#e74c3c');
            crearGrafico('chartOsea', 'kg Masa Ósea', registros.map(r => r.osea), etiquetas, '#9b59b6');
            crearGrafico('chartMusculo', '% Músculo', registros.map(r => r.musculo), etiquetas, '#2ecc71');
            crearGrafico('chartIMC', 'IMC', registros.map(r => r.imc), etiquetas, '#f1c40f');
            crearGrafico('chartPeso', 'Peso (kg)', registros.map(r => r.peso), etiquetas, '#34495e');

            if(btnDescargarCombinado) btnDescargarCombinado.style.display = 'inline-flex';

        } catch (error) { console.error("Error:", error); }
    };

    const cargarGraficoGeneral = async () => {
        try {
            const snap = await getDocs(collection(db, "pacientes"));
            const data = snap.docs.map(d => d.data());
            const categorias = { "Bajo": 0, "Normal": 0, "Sobrepeso": 0, "Obesidad": 0 };
            
            data.forEach(p => {
                const imc = parseFloat(p.imc);
                if(imc < 18.5) categorias["Bajo"]++;
                else if(imc < 25) categorias["Normal"]++;
                else if(imc < 30) categorias["Sobrepeso"]++;
                else categorias["Obesidad"]++;
            });

            crearGrafico('chartGeneral', 'Distribución IMC General', Object.values(categorias), Object.keys(categorias), '#27ae60');
        } catch (e) { console.error(e); }
    };

    // Descarga Gráfico General
    document.getElementById('btnDescargarGeneral')?.addEventListener('click', () => {
        const canvas = document.getElementById('chartGeneral');
        if (!canvas) return;
        const link = document.createElement('a');
        link.download = 'Estado_General_Gendarmeria.png';
        
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const ctx = tempCanvas.getContext('2d');
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        ctx.drawImage(canvas, 0, 0);
        
        link.href = tempCanvas.toDataURL('image/png');
        link.click();
    });

    // Descarga Reporte Combinado
    btnDescargarCombinado?.addEventListener('click', () => {
        const idsGráficos = ['chartAguaCoroporal', 'chartGrasa', 'chartkgMasaOsea', 'chartMusculo', 'chartIMC', 'chartPeso'];
        const nombrePaciente = document.getElementById('nombrePacienteEvolucion').innerText.replace('Paciente: ', '').trim();
        const dni = document.getElementById('busquedaDNI').value;

        const refCanvas = document.getElementById(idsGráficos[0]);
        if(!refCanvas) return;

        const chartWidth = refCanvas.width;
        const chartHeight = refCanvas.height;
        const padding = 20;
        const headerHeight = 60;

        const maestroCanvas = document.createElement('canvas');
        maestroCanvas.width = (chartWidth * 2) + (padding * 3);
        maestroCanvas.height = (chartHeight * 3) + (padding * 4) + headerHeight;
        const ctx = maestroCanvas.getContext('2d');

        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, maestroCanvas.width, maestroCanvas.height);

        ctx.fillStyle = "#2c3e50";
        ctx.font = "bold 16px 'Segoe UI', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`Reporte Nutricional: ${nombrePaciente} (DNI: ${dni})`, maestroCanvas.width / 2, padding + 20);

        idsGráficos.forEach((id, index) => {
            const canvasElement = document.getElementById(id);
            if (!canvasElement) return;
            const col = index % 2;
            const row = Math.floor(index / 2);
            const x = padding + (col * (chartWidth + padding));
            const y = headerHeight + padding + (row * (chartHeight + padding));
            ctx.drawImage(canvasElement, x, y);
        });

        const link = document.createElement('a');
        link.download = `Evolucion_${nombrePaciente.replace(/\s+/g, '_')}.png`;
        link.href = maestroCanvas.toDataURL('image/png');
        link.click();
    });

    document.getElementById('btnVerEvolucion')?.addEventListener('click', cargarEvolucionIndividual);
    cargarGraficoGeneral();
}

document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.getElementById('menuToggle');
    const navMenu = document.getElementById('navMenu');

    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            
            // Cambiar el icono de barras a una "X" al abrir
            const icon = menuToggle.querySelector('i');
            if (navMenu.classList.contains('active')) {
                icon.classList.replace('fa-bars', 'fa-times');
            } else {
                icon.classList.replace('fa-times', 'fa-bars');
            }
        });
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.getElementById('menuToggle');
    const navMenu = document.getElementById('navMenu');

    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            
            // Cambiar icono: barras por X
            const icon = menuToggle.querySelector('i');
            if (navMenu.classList.contains('active')) {
                icon.classList.replace('fa-bars', 'fa-times');
            } else {
                icon.classList.replace('fa-times', 'fa-bars');
            }
        });
    }
});


// --- ACTUALIZACIÓN DE IMC EN VIVO (ficha.html) ---
const inputPeso = document.getElementById('peso');
const inputTalla = document.getElementById('talla');
const displayIMC = document.getElementById('valIMC');

if (inputPeso && inputTalla && displayIMC) {
    const actualizarIMCRealTime = () => {
        const p = parseFloat(inputPeso.value);
        const t = parseFloat(inputTalla.value);
        displayIMC.innerText = calcularIMC(p, t);
    };

    inputPeso.addEventListener('input', actualizarIMCRealTime);
    inputTalla.addEventListener('input', actualizarIMCRealTime);
}

// --- ACTUALIZACIÓN DE IMC EN VIVO PARA FICHA ---

if (inputPeso && inputTalla && displayIMC) {
    const actualizarIMCRealTime = () => {
        const p = parseFloat(inputPeso.value);
        const t = parseFloat(inputTalla.value);
        // Reutiliza tu función calcularIMC definida al inicio de script.js
        displayIMC.innerText = calcularIMC(p, t);
    };

    // Escuchar cambios mientras el usuario escribe
    inputPeso.addEventListener('input', actualizarIMCRealTime);
    inputTalla.addEventListener('input', actualizarIMCRealTime);
}

// --- MANEJO ÚNICO DEL MENÚ RESPONSIVO ---
document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.getElementById('menuToggle');
    const navMenu = document.getElementById('navMenu');

    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', (e) => {
            e.stopPropagation(); // Evita problemas de propagación
            navMenu.classList.toggle('active');
            
            const icon = menuToggle.querySelector('i');
            if (navMenu.classList.contains('active')) {
                icon.classList.replace('fa-bars', 'fa-times');
            } else {
                icon.classList.replace('fa-times', 'fa-bars');
            }
        });
    }
});