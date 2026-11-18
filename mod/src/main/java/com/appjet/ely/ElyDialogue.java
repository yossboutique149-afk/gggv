package com.appjet.ely;

import net.minecraft.server.network.ServerPlayerEntity;
import net.minecraft.text.ClickEvent;
import net.minecraft.text.HoverEvent;
import net.minecraft.text.MutableText;
import net.minecraft.text.Text;
import net.minecraft.util.Formatting;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Árbol de diálogo de Ely. Cada nodo tiene una frase y varias respuestas;
 * las respuestas se eligen con clic en el chat o con /ely elegir <nodo> <indice>.
 */
public final class ElyDialogue {

    public record Opcion(String clave, int afinidad, String siguiente) {
    }

    public record Nodo(String clave, boolean usaGenero, List<Opcion> opciones) {
    }

    private static final Map<String, Nodo> NODOS = new LinkedHashMap<>();

    static {
        nodo("raiz", "elylang.nodo.raiz", false,
            new Opcion("elylang.opc.raiz.1", 2, "quien"),
            new Opcion("elylang.opc.raiz.2", 2, "saludo"),
            new Opcion("elylang.opc.raiz.3", 2, "bosque"),
            new Opcion("elylang.opc.raiz.4", 3, "pasado"),
            new Opcion("elylang.opc.raiz.5", 3, "nosotros"),
            new Opcion("elylang.opc.raiz.6", 3, "futuro"),
            new Opcion("elylang.opc.raiz.7", 2, "adios"));

        nodo("quien", "elylang.presentacion", true,
            new Opcion("elylang.opc.quien.1", 4, "saludo"),
            new Opcion("elylang.opc.quien.2", 3, "pasado"));

        nodo("saludo", "elylang.nodo.saludo", false,
            new Opcion("elylang.opc.saludo.1", 4, "adios"),
            new Opcion("elylang.opc.saludo.2", 5, "cuidado"),
            new Opcion("elylang.opc.saludo.3", 3, "adios"));

        nodo("cuidado", "elylang.nodo.cuidado", false,
            new Opcion("elylang.opc.cuidado.1", 6, "fin"),
            new Opcion("elylang.opc.cuidado.2", 8, "fin"));

        nodo("bosque", "elylang.nodo.bosque", false,
            new Opcion("elylang.opc.bosque.1", 4, "nosotros"),
            new Opcion("elylang.opc.bosque.2", 3, "arbol"),
            new Opcion("elylang.opc.bosque.3", 2, "fin"));

        nodo("arbol", "elylang.nodo.arbol", false,
            new Opcion("elylang.opc.arbol.1", 5, "fin"));

        nodo("pasado", "elylang.nodo.pasado", false,
            new Opcion("elylang.opc.pasado.1", 6, "fin"),
            new Opcion("elylang.opc.pasado.2", 3, "fin"),
            new Opcion("elylang.opc.pasado.3", 1, "fin"));

        nodo("nosotros", "elylang.nodo.nosotros", false,
            new Opcion("elylang.opc.nosotros.1", 7, "fin"),
            new Opcion("elylang.opc.nosotros.2", 2, "fin"),
            new Opcion("elylang.opc.nosotros.3", -5, "fin"));

        nodo("futuro", "elylang.nodo.futuro", false,
            new Opcion("elylang.opc.futuro.1", 8, "fin"),
            new Opcion("elylang.opc.futuro.2", 5, "fin"),
            new Opcion("elylang.opc.futuro.3", 1, "fin"));

        nodo("adios", "elylang.nodo.adios", false,
            new Opcion("elylang.opc.adios.1", 3, "fin"));

        nodo("fin", "elylang.nodo.fin", false,
            new Opcion("elylang.opc.fin.1", 0, ""));
    }

    private ElyDialogue() {
    }

    /** Identificadores de nodo, para sugerencias de comandos. */
    public static java.util.Set<String> ids() {
        return NODOS.keySet();
    }

    private static void nodo(String id, String clave, boolean usaGenero, Opcion... opciones) {
        NODOS.put(id, new Nodo(clave, usaGenero, List.of(opciones)));
    }

    public static void abrirMenu(ServerPlayerEntity jugador) {
        ElyState estado = ElyState.get(jugador.getServer());
        if (!estado.tieneGenero(jugador.getUuid())) {
            ElyJoin.pedirGenero(jugador);
        }
        mostrar(jugador, "raiz");
        mostrarAcciones(jugador);
        jugador.sendMessage(Text.translatable("elylang.menu.ayuda").formatted(Formatting.DARK_GRAY), false);
    }

    /**
     * Acciones del amuleto como líneas clicables: el jugador solo hace clic,
     * no necesita escribir ningún comando para que Ely actúe.
     */
    private static void mostrarAcciones(ServerPlayerEntity jugador) {
        jugador.sendMessage(Text.translatable("elylang.menu.acciones").formatted(Formatting.DARK_GRAY), false);
        accion(jugador, "picar", "elylang.menu.accion.picar");
        accion(jugador, "minar", "elylang.menu.accion.minar");
        accion(jugador, "proteger", "elylang.menu.accion.proteger");
        accion(jugador, "flor", "elylang.menu.accion.flor");
        accion(jugador, "acariciar", "elylang.menu.accion.acariciar");
        accion(jugador, "intimidad", "elylang.menu.accion.intimidad");
    }

    private static void accion(ServerPlayerEntity jugador, String subcomando, String clave) {
        MutableText linea = Text.literal("  ❤ ").formatted(Formatting.DARK_GRAY)
            .append(Text.translatable(clave).formatted(Formatting.LIGHT_PURPLE));
        linea.styled(estilo -> estilo
            .withClickEvent(new ClickEvent(ClickEvent.Action.RUN_COMMAND, "/ely " + subcomando))
            .withHoverEvent(new HoverEvent(HoverEvent.Action.SHOW_TEXT, Text.translatable("elylang.hover.accion"))));
        jugador.sendMessage(linea, false);
    }

    public static void mostrar(ServerPlayerEntity jugador, String id) {
        if (id == null || id.isEmpty() || !NODOS.containsKey(id)) {
            jugador.sendMessage(Text.translatable("elylang.cierre").formatted(Formatting.DARK_GRAY), false);
            return;
        }

        Nodo nodo = NODOS.get(id);
        ElyState estado = ElyState.get(jugador.getServer());
        int afinidad = estado.afinidad(jugador.getUuid());

        jugador.sendMessage(
            Text.translatable("elylang.cabecera", Text.translatable(estadoClave(afinidad)), String.valueOf(afinidad))
                .formatted(Formatting.LIGHT_PURPLE),
            false
        );

        String claveTexto = nodo.usaGenero()
            ? nodo.clave() + "." + estado.genero(jugador.getUuid())
            : nodo.clave();

        jugador.sendMessage(Text.translatable(claveTexto).formatted(Formatting.WHITE), false);

        List<Opcion> opciones = nodo.opciones();
        for (int i = 0; i < opciones.size(); i++) {
            Opcion opcion = opciones.get(i);
            String comando = "/ely elegir " + id + " " + i;
            MutableText linea = Text.literal("  ▸ ").formatted(Formatting.DARK_GRAY)
                .append(Text.translatable(opcion.clave()).formatted(Formatting.AQUA));
            linea.styled(estilo -> estilo
                .withClickEvent(new ClickEvent(ClickEvent.Action.RUN_COMMAND, comando))
                .withHoverEvent(new HoverEvent(HoverEvent.Action.SHOW_TEXT, Text.translatable("elylang.hover.elegir"))));
            jugador.sendMessage(linea, false);
        }
    }

    public static void elegir(ServerPlayerEntity jugador, String id, int indice) {
        Nodo nodo = NODOS.get(id);
        if (nodo == null) {
            mostrar(jugador, "raiz");
            return;
        }
        if (indice < 0 || indice >= nodo.opciones().size()) {
            mostrar(jugador, id);
            return;
        }

        Opcion opcion = nodo.opciones().get(indice);
        ElyState estado = ElyState.get(jugador.getServer());
        int nueva = estado.sumarAfinidad(jugador.getUuid(), opcion.afinidad());

        jugador.sendMessage(
            Text.literal("▸ ").formatted(Formatting.DARK_GRAY)
                .append(Text.translatable(opcion.clave()).formatted(Formatting.GRAY)),
            false
        );

        if (opcion.afinidad() != 0) {
            jugador.sendMessage(
                Text.translatable(
                    "elylang.dialogo.afinidad",
                    opcion.afinidad() > 0 ? "+" : "",
                    opcion.afinidad(),
                    nueva
                ).formatted(opcion.afinidad() > 0 ? Formatting.LIGHT_PURPLE : Formatting.RED),
                false
            );
        }

        mostrar(jugador, opcion.siguiente());
    }

    public static String estadoClave(int afinidad) {
        if (afinidad >= 95) {
            return "elylang.estado.4";
        }
        if (afinidad >= 75) {
            return "elylang.estado.3";
        }
        if (afinidad >= 50) {
            return "elylang.estado.2";
        }
        if (afinidad >= 25) {
            return "elylang.estado.1";
        }
        return "elylang.estado.0";
    }
}
