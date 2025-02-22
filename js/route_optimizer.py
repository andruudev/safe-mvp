# Simulación de optimización de rutas
def optimize_route(origin, destination):
    # Datos simulados
    routes = {
        ("Quito", "Cumbayá"): {
            "optimal_route": "Quito -> Valle de los Chillos -> Cumbayá",
            "km_saved": 5,
            "co2_reduced": 3,
            "jaguarcoins": 50,
        }
    }

    return routes.get((origin, destination), {})

# Ejemplo de uso
if __name__ == "__main__":
    origin = "Quito"
    destination = "Cumbayá"
    result = optimize_route(origin, destination)
    print(result)