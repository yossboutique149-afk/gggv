# Ely, compañera del alma — mod de Minecraft (Java + Bedrock)

Mod de Minecraft con una compañera llamada **Ely**, un espíritu del bosque **enamorado del jugador**.
Al empezar el mundo recibes el **Amuleto del Corazón**, un objeto que abre un diálogo con ella y desde
el que puedes pedirle acciones: **picar leña, minar, protegerte**, regalarle flores, acariciarla y tener
una **noche de pasión** (romance **no explícito**: fundido a negro y elipsis, solo para adultos).

**El jugador elige el género de Ely** (chica / chico / no binario) y puede cambiarlo cuando quiera.

Este repositorio incluye tres entregables:

| Carpeta | Qué es |
| --- | --- |
| `web/` + `server.js` | Demo web jugable del sistema de diálogo, afinidad y acciones (para probar sin Minecraft). |
| `mod/` | Mod para **Minecraft Java Edition** (Fabric, MC 1.21.1). |
| `bedrock/` | Addon para **Minecraft Bedrock Edition** (behavior pack + resource pack con scripts). |

---

## 1. Demo web (ya desplegada)

```bash
npm run build     # valida el árbol de diálogo y copia web/ a dist/
npm start         # http://localhost:3000  (escucha en 0.0.0.0:$PORT)
```

No tiene dependencias: solo Node.js 20 o superior. Guarda tu progreso en `localStorage`,
incluye el selector de género, la barra de afinidad, las seis acciones y el fundido a negro.

## 2. Mod para Java Edition (Fabric)

Requisitos: **JDK 21** y **Gradle 8.7+**.

```bash
cd mod
gradle build          # o: gradle wrapper && ./gradlew build
# resultado: mod/build/libs/elylang-1.0.0.jar
```

Instalación:

1. Instala **Fabric Loader** para Minecraft 1.21.1 (https://fabricmc.net/use).
2. Copia `elylang-1.0.0.jar` y **Fabric API** en `.minecraft/mods/`.
3. Entra a un mundo: recibirás el Amuleto del Corazón y la pregunta del género.

Comandos:

| Comando | Efecto |
| --- | --- |
| `/ely` | Abre el menú de Ely (diálogo y acciones). |
| `/ely genero <femenino\|masculino\|neutro>` | Define el género de Ely. |
| `/ely elegir <nodo>` | Salta a un nodo de diálogo concreto. |
| `/ely accion <picar\|minar\|proteger\|flor\|acariciar\|noche>` | Ejecuta una acción. |
| `/ely afinidad [valor]` | Consulta o fija la afinidad (0-100). |
| `/ely adulto` | Confirma que eres mayor de edad (obligatorio para la noche de pasión). |
| `/ely amuleto` | Recupera el Amuleto del Corazón. |

También funciona el **clic derecho** con el amuleto y los botones clicables del chat.

### Cambiar de versión de Minecraft

`mod/gradle.properties` centraliza las versiones; cambia `minecraft_version`, `yarn_mappings`,
`loader_version` y `fabric_version` por las de tu versión de Minecraft y vuelve a compilar.

## 3. Addon para Bedrock Edition

```bash
npm run pack:bedrock     # genera dist/elylang.mcaddon (behavior pack + resource pack)
```

1. Abre `elylang.mcaddon` con Minecraft (doble clic / importar).
2. Activa el **behavior pack** y el **resource pack** en el mundo.
3. En los ajustes del mundo activa **Beta APIs** (el addon usa `@minecraft/server` 1.15 y `@minecraft/server-ui` 1.3).
4. Al entrar recibes el amuleto y eliges el género.

En Bedrock, además del amuleto, puedes usar:

```
/scriptevent ely:menu        /scriptevent ely:genero
/scriptevent ely:picar       /scriptevent ely:minar
/scriptevent ely:proteger    /scriptevent ely:flor
/scriptevent ely:acariciar   /scriptevent ely:noche
/scriptevent ely:adulto      (confirma mayoría de edad)
```

## Sistema de afinidad

| Afinidad | Estado |
| --- | --- |
| 0-24 | Desconfianza |
| 25-49 | Curiosidad |
| 50-74 | Encariñado |
| 75-94 | Enamorado |
| 95-100 | Perdidamente enamorado |

Las acciones suben la afinidad (picar +4, minar +6, proteger +6, flor +7, acariciar +6, noche +10) y las
respuestas del diálogo también. La **noche de pasión** exige afinidad ≥ 80, que sea de noche, mayoría de
edad confirmada y un tiempo de descanso entre encuentros.

## Contenido sensible

El romance está escrito de forma **no explícita**: la escena se resuelve con un fundido a negro, niebla y
elipsis; nunca se describen actos sexuales. La opción está bloqueada hasta que el jugador confirma que es
adulto, y el personaje es un espíritu ficticio del juego.

## Compatibilidad

- **Java:** Fabric 1.21.1 (Loom 1.7, Java 21). Con otra versión hay que ajustar `gradle.properties`.
- **Bedrock:** Minecraft 1.21 o superior con scripts activados.
- El mod de Java **no se ha compilado en este entorno** (sin Gradle ni acceso a los repositorios de
  Mojang/Fabric); el código y los recursos están completos y las versiones fijadas en `gradle.properties`.
- El addon de Bedrock no se puede ejecutar en este entorno; el `.mcaddon` se genera y se valida su estructura.
