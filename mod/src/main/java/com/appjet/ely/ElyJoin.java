package com.appjet.ely;

import net.minecraft.item.ItemStack;
import net.minecraft.server.network.ServerPlayerEntity;
import net.minecraft.text.ClickEvent;
import net.minecraft.text.HoverEvent;
import net.minecraft.text.MutableText;
import net.minecraft.text.Text;
import net.minecraft.util.Formatting;

/** Entrega del amuleto y elección de género al empezar el mundo. */
public final class ElyJoin {

    private ElyJoin() {
    }

    public static void alEntrar(ServerPlayerEntity jugador) {
        ElyState estado = ElyState.get(jugador.getServer());

        if (!estado.amuletoEntregado(jugador.getUuid())) {
            estado.marcarAmuleto(jugador.getUuid());
            jugador.getInventory().insertStack(new ItemStack(ElyItems.AMULETO));
            jugador.sendMessage(Text.translatable("elylang.bienvenida").formatted(Formatting.LIGHT_PURPLE), false);
        } else if (!tieneAmuleto(jugador)) {
            jugador.sendMessage(
                Text.literal("▸ ").formatted(Formatting.DARK_GRAY)
                    .append(Text.translatable("elylang.menu.ayuda").formatted(Formatting.GRAY)),
                false
            );
        }

        if (!estado.tieneGenero(jugador.getUuid())) {
            pedirGenero(jugador);
        }
    }

    /** El jugador define el género de su compañera con botones clicables. */
    public static void pedirGenero(ServerPlayerEntity jugador) {
        jugador.sendMessage(Text.translatable("elylang.genero.pedir").formatted(Formatting.LIGHT_PURPLE), false);
        jugador.sendMessage(opcion("elylang.genero.opcion.femenino", "/ely genero femenino"), false);
        jugador.sendMessage(opcion("elylang.genero.opcion.masculino", "/ely genero masculino"), false);
        jugador.sendMessage(opcion("elylang.genero.opcion.neutro", "/ely genero neutro"), false);
    }

    private static MutableText opcion(String clave, String comando) {
        MutableText linea = Text.literal("  ▸ ").formatted(Formatting.DARK_GRAY)
            .append(Text.translatable(clave).formatted(Formatting.AQUA));
        linea.styled(estilo -> estilo
            .withClickEvent(new ClickEvent(ClickEvent.Action.RUN_COMMAND, comando))
            .withHoverEvent(new HoverEvent(HoverEvent.Action.SHOW_TEXT, Text.translatable("elylang.hover.elegir"))));
        return linea;
    }

    private static boolean tieneAmuleto(ServerPlayerEntity jugador) {
        for (int i = 0; i < jugador.getInventory().size(); i++) {
            if (jugador.getInventory().getStack(i).isOf(ElyItems.AMULETO)) {
                return true;
            }
        }
        return false;
    }
}
