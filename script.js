import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    query, 
    where, 
    getDocs 
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// --- CONFIGURACIÓN DE FIREBASE ---
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

// --- FUNCIONES DE UTILIDAD ---
const calcularIMC = (p, t) => (p > 0 && t > 0) ? (p / (t * t)).toFixed(2) : "0.00";

const obtenerEdad = (fechaNacimiento) => {
    if (!fechaNacimiento) return "";
    const hoy = new Date();
    const cumple = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - cumple.getFullYear();
    const mes = hoy.getMonth() - cumple.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < cumple.getDate())) {
        edad--;
    }
    return edad >= 0 ? `${edad} años` : "";
};

// --- LÓGICA COMPARTIDA (DOM LOADED) ---
document.addEventListener('DOMContentLoaded', () => {
    
    // 1. CÁLCULO DE EDAD AUTOMÁTICO EN REGISTRO
    const inputFechaNac = document.getElementById('fechaNac');
    const displayEdad = document.getElementById('edad');

    if (inputFechaNac && displayEdad) {
        inputFechaNac.addEventListener('input', () => {
            displayEdad.value = obtenerEdad(inputFechaNac.value);
        });
    }

    // 2. REGISTRO DE PERSONAL (registro.html)
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
                edad: document.getElementById('edad').value, // Se guarda la edad calculada
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
                if(displayEdad) displayEdad.value = "";
            } catch (error) { alert("Error al registrar."); }
        });
    }

    // 3. BUSCADOR DE PACIENTE (ficha.html)
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
                    docs.sort((a, b) => new Date(b.fechaRegistro) - new Date(a.fechaRegistro));
                    const data = docs[0]; 

                    formEdicion.style.display = 'block';
                    document.getElementById('nombreTitulo').innerText = data.nombre;
                    document.getElementById('nombre').value = data.nombre;
                    document.getElementById('dni').value = data.dni;
                    document.getElementById('jerarquia').value = data.jerarquia;
                    
                    // Carga de Fecha de Nacimiento y Edad
                    if(document.getElementById('fechaNacUpdate')) document.getElementById('fechaNacUpdate').value = data.fechaNac || '';
                    if(document.getElementById('edad')) document.getElementById('edad').value = data.edad || '';
                    
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
            } catch (error) { console.error("Error al buscar:", error); }
        });
    }

    // 4. GUARDAR NUEVA ENTRADA (ficha.html)
    const updateForm = document.getElementById('updateForm');
    if (updateForm) {
        updateForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const peso = parseFloat(document.getElementById('peso').value);
            const talla = parseFloat(document.getElementById('talla').value);

            const nuevaMedicion = {
                nombre: document.getElementById('nombre').value,
                dni: document.getElementById('dni').value,
                jerarquia: document.getElementById('jerarquia').value,
                ce: document.getElementById('ce').value, 
                telefono: document.getElementById('telefono').value,
                fechaNac: document.getElementById('fechaNacUpdate').value, // Mantiene la fecha original
                edad: document.getElementById('edad').value,             // Mantiene la edad calculada
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
                alert("✅ Nueva medición guardada.");
            } catch (error) { alert("Error al guardar historial."); }
        });
    }

    // 5. REDIRECCIÓN AL HISTORIAL
    document.getElementById('btnVerHistorial')?.addEventListener('click', () => {
        const dni = document.getElementById('dni').value;
        window.location.href = `historial.html?dni=${dni}`;
    });

    // 6. ACTUALIZACIÓN DE IMC EN TIEMPO REAL (Ficha)
    const inputPeso = document.getElementById('peso');
    const inputTalla = document.getElementById('talla');
    const displayIMC = document.getElementById('valIMC');

    if (inputPeso && inputTalla && displayIMC) {
        const actualizarIMC = () => {
            displayIMC.innerText = calcularIMC(parseFloat(inputPeso.value), parseFloat(inputTalla.value));
        };
        inputPeso.addEventListener('input', actualizarIMC);
        inputTalla.addEventListener('input', actualizarIMC);
    }
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
            if(!container) return;
            container.innerHTML = "";

            if(snap.empty) { container.innerHTML = "<p>No hay antecedentes.</p>"; return; }

            const registros = snap.docs.map(d => d.data());
            registros.sort((a, b) => new Date(b.fechaRegistro) - new Date(a.fechaRegistro));

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
                        <p><strong>Edad al momento:</strong> ${reg.edad || 'N/A'}</p>
                        <p><strong>Peso:</strong> ${reg.peso}kg | <strong>Talla:</strong> ${reg.talla}m</p>
                        <p><strong>Composición:</strong> Mus: ${reg.musculo}% | Gra: ${reg.grasa}% | Masa Ósea: ${reg.osea}kg | Agua: ${reg.agua}%</p>
                        <p><strong>Observaciones:</strong> ${reg.novedades || 'Sin novedades'}</p>
                    </div>
                `;
            });
        } catch (error) { console.error("Error al cargar historial:", error); }
    };
    cargarHistorial();
}






