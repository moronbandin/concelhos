import random

def adivina_el_numero():
    print("¡Bienvenido al juego de adivinanza de números!")
    print("He seleccionado un número entre 1 y 100. ¿Puedes adivinar cuál es?")

    numero_secreto = random.randint(1, 100)
    intentos = 0

    while True:
        try:
            adivinanza = int(input("Introduce tu adivinanza: "))
            intentos += 1

            if adivinanza < numero_secreto:
                print("Demasiado bajo. ¡Inténtalo de nuevo!")
            elif adivinanza > numero_secreto:
                print("Demasiado alto. ¡Inténtalo de nuevo!")
            else:
                print(f"¡Felicidades! Adivinaste el número en {intentos} intentos.")
                break
        except ValueError:
            print("Por favor, introduce un número válido.")

if __name__ == "__main__":
    adivina_el_numero()
