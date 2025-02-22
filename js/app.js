let map, directionsService, directionsRenderer, droneMarker, routeCoordinates = [];
let currentStep = 0;



// Mostrar formulario de registro
function showSignup() {
  document.getElementById("login-form").style.display = "none";
  document.getElementById("signup-form").style.display = "block";
}

// Mostrar formulario de login
function showLogin() {
  document.getElementById("signup-form").style.display = "none";
  document.getElementById("login-form").style.display = "block";
}

// Registrar usuario
document.getElementById("signup")?.addEventListener("submit", (e) => {
  e.preventDefault();

  const name = document.getElementById("signup-name").value.trim();
  const email = document.getElementById("signup-email").value.trim();
  const password = document.getElementById("signup-password").value.trim();

  if (!name || !email || !password) {
    alert("Por favor, completa todos los campos.");
    return;
  }

  // Validar formato de correo electrónico
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    alert("Por favor, ingresa un correo electrónico válido.");
    return;
  }

  // Guardar usuario en localStorage
  const users = JSON.parse(localStorage.getItem("users")) || [];
  const existingUser = users.find((u) => u.email === email);

  if (existingUser) {
    alert("Este correo electrónico ya está registrado. Por favor, inicia sesión.");
    return;
  }

  users.push({ name, email, password });
  localStorage.setItem("users", JSON.stringify(users));

  alert("Registro exitoso. Por favor, inicia sesión.");
  showLogin();
});

// Iniciar sesión
document.getElementById("login")?.addEventListener("submit", (e) => {
  e.preventDefault();

  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value.trim();

  if (!email || !password) {
    alert("Por favor, completa todos los campos.");
    return;
  }

  const users = JSON.parse(localStorage.getItem("users")) || [];
  const user = users.find((u) => u.email === email && u.password === password);

  if (user) {
    localStorage.setItem("currentUser", JSON.stringify(user));
    window.location.href = "dashboard.html"; // Redirigir al dashboard
  } else {
    alert("Correo o contraseña incorrectos.");
  }
});

// Verificar si hay un usuario logueado (para dashboard.html)
if (document.getElementById("logout")) {
  document.getElementById("logout").addEventListener("click", () => {
    localStorage.removeItem("currentUser");
    window.location.href = "index.html"; // Redirigir al login
  });

  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  if (!currentUser) {
    window.location.href = "index.html"; // Redirigir al login si no hay sesión
  }
}

// Inicializar el mapa
function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: -0.1807, lng: -78.4678 }, // Centro en Quito, Ecuador
    zoom: 12,
  });

  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer({ map });
}

// Mostrar política de reembolso
function showRefundPolicy() {
  alert(
    "Política de Reembolso:\n\n" +
    "1. Si el envío no se completa, ofrecemos un reembolso del 100%.\n" +
    "2. El reembolso depende del peso del paquete:\n" +
    "   - Hasta 1 kg: $5\n" +
    "   - Hasta 2 kg: $10\n" +
    "   - Hasta 4 kg: $20\n" +
    "3. Los reembolsos se procesan dentro de 5 días hábiles."
  );
}

// Manejar la carga de fotos
document.getElementById("photos").addEventListener("change", (event) => {
  const files = event.target.files;
  const previewContainer = document.getElementById("preview-container");
  previewContainer.innerHTML = ""; // Limpiar vista previa anterior

  if (files.length > 0) {
    document.getElementById("photo-preview").style.display = "block";

    for (const file of files) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = document.createElement("img");
        img.src = e.target.result;
        previewContainer.appendChild(img);
      };
      reader.readAsDataURL(file);
    }
  } else {
    document.getElementById("photo-preview").style.display = "none";
  }
});

// Calcular ruta
// Calcular ruta
document.getElementById("route-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const origin = document.getElementById("origin").value;
  const destination = document.getElementById("destination").value;
  const packageWeight = document.getElementById("package-weight").value;
  const priority = document.getElementById("priority").value;
  const itemToSend = document.getElementById("item-to-send").value; // Nuevo campo
  const isFragile = document.getElementById("is-fragile").checked; // Capturar si es frágil

  if (!document.getElementById("refund-policy").checked) {
    alert("Debes aceptar la política de reembolso para continuar.");
    return;
  }

  if (!itemToSend.trim()) {
    alert("Por favor, indica qué vas a enviar.");
    return;
  }

  // Mostrar lo que el usuario va a enviar
  alert(`El usuario va a enviar: ${itemToSend}`);

  // Mostrar advertencia si el paquete es frágil
  if (isFragile) {
    alert("¡Atención! El paquete es frágil. Se tomarán precauciones adicionales durante el envío.");
  }

  const request = {
    origin,
    destination,
    travelMode: "DRIVING",
  };

  directionsService.route(request, (result, status) => {
    if (status === "OK") {
      directionsRenderer.setDirections(result);
      const route = result.routes[0].legs[0];
      document.getElementById("optimal-route").textContent = `${route.start_address} -> ${route.end_address}`;
      document.getElementById("km-saved").textContent = (route.distance.value / 1000).toFixed(2);
      document.getElementById("co2-reduced").textContent = ((route.distance.value / 1000) * 0.2).toFixed(2); // Suponiendo 0.2 kg CO2/km
      document.getElementById("jaguarcoins").textContent = Math.floor(route.distance.value / 1000);

      // Guardar coordenadas de la ruta
      routeCoordinates = result.routes[0].overview_path;
      startDroneSimulation();
    } else {
      alert("Error al calcular la ruta");
    }
  });

  document.getElementById("map-section").style.display = "block";
});
// Simular movimiento del dron
function startDroneSimulation() {
  if (!droneMarker) {
    droneMarker = new google.maps.Marker({
      position: routeCoordinates[0],
      map,
      icon: "https://maps.google.com/mapfiles/ms/icons/drone.png", // Ícono personalizado para el dron
    });
  }

  currentStep = 0;
  simulateDroneMovement();
}

function simulateDroneMovement() {
  if (currentStep < routeCoordinates.length) {
    const position = routeCoordinates[currentStep];
    droneMarker.setPosition(position);
    map.panTo(position);

    // Mostrar la ubicación actual del dron en la interfaz
    document.getElementById("drone-location").textContent = `Lat: ${position.lat().toFixed(4)}, Lng: ${position.lng().toFixed(4)}`;
    document.getElementById("drone-tracking").style.display = "block";

    currentStep++;
    setTimeout(simulateDroneMovement, 1000); // Mover cada segundo
  } else {
    alert("Entrega completada");
  }
}

// Inicializar mapa al cargar la página
window.onload = initMap;

