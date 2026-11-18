package com.appjet.ely;

import net.fabricmc.api.ModInitializer;
import net.fabricmc.fabric.api.event.lifecycle.v1.ServerTickEvents;
import net.fabricmc.fabric.api.networking.v1.ServerPlayConnectionEvents;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Punto de entrada del mod "Ely, compañera del alma".
 *
 * Al empezar el mundo cada jugador recibe el Amuleto del Corazón, con el que
 * puede dialogar con Ely, elegir su género y pedirle acciones.
 */
public class ElyMod implements ModInitializer {
    public static final String MOD_ID = "elylang";
    public static final Logger LOGGER = LoggerFactory.getLogger(MOD_ID);

    @Override
    public void onInitialize() {
        ElyItems.register();
        ElyCommands.register();

        ServerPlayConnectionEvents.JOIN.register((handler, sender, server) -> ElyJoin.alEntrar(handler.player));
        ServerTickEvents.END_SERVER_TICK.register(ElyActions::tick);

        LOGGER.info("[elylang] Ely ha despertado en este mundo.");
    }
}
