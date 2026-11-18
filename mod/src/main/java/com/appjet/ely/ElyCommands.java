package com.appjet.ely;

import com.mojang.brigadier.CommandDispatcher;
import com.mojang.brigadier.arguments.IntegerArgumentType;
import com.mojang.brigadier.arguments.StringArgumentType;
import com.mojang.brigadier.context.CommandContext;
import com.mojang.brigadier.exceptions.CommandSyntaxException;
import com.mojang.brigadier.suggestion.SuggestionProvider;
import net.fabricmc.fabric.api.command.v2.CommandRegistrationCallback;
import net.minecraft.command.CommandSource;
import net.minecraft.server.command.CommandManager;
import net.minecraft.server.command.ServerCommandSource;
import net.minecraft.server.network.ServerPlayerEntity;
import net.minecraft.text.Text;
import net.minecraft.util.Formatting;

/** Comandos del mod: /ely ... */
public final class ElyCommands {

    private ElyCommands() {
    }

    public static void register() {
        CommandRegistrationCallback.EVENT.register((dispatcher, registryAccess, environment) -> registrar(dispatcher));
    }

    private static void registrar(CommandDispatcher<ServerCommandSource> dispatcher) {
        SuggestionProvider<ServerCommandSource> generos = (contexto, builder) ->
            CommandSource.suggestMatching(new String[]{"femenino", "masculino", "neutro"}, builder);

        SuggestionProvider<ServerCommandSource> nodos = (contexto, builder) ->
            CommandSource.suggestMatching(ElyDialogue.ids(), builder);

        dispatcher.register(CommandManager.literal("ely")
            .executes(ElyCommands::menu)
            .then(CommandManager.literal("menu").executes(ElyCommands::menu))
            .then(CommandManager.literal("ayuda").executes(ElyCommands::ayuda))
            .then(CommandManager.literal("estado").executes(ElyCommands::estado))
            .then(CommandManager.literal("genero")
                .then(CommandManager.argument("valor", StringArgumentType.word())
                    .suggests(generos)
                    .executes(ElyCommands::genero)))
            .then(CommandManager.literal("elegir")
                .then(CommandManager.argument("nodo", StringArgumentType.word())
                    .suggests(nodos)
                    .then(CommandManager.argument("indice", IntegerArgumentType.integer(0, 20))
                        .executes(ElyCommands::elegir))))
            .then(CommandManager.literal("picar").executes(ElyCommands::picar))
            .then(CommandManager.literal("minar").executes(ElyCommands::minar))
            .then(CommandManager.literal("proteger").executes(ElyCommands::proteger))
            .then(CommandManager.literal("flor").executes(ElyCommands::flor))
            .then(CommandManager.literal("acariciar").executes(ElyCommands::acariciar))
            .then(CommandManager.literal("intimidad").executes(ElyCommands::intimidad))
            .then(CommandManager.literal("afinidad")
                .then(CommandManager.argument("valor", IntegerArgumentType.integer(0, 100))
                    .executes(ElyCommands::afinidad)))
            .then(CommandManager.literal("adulto")
                .executes(ElyCommands::avisoAdulto)
                .then(CommandManager.literal("confirmo").executes(ElyCommands::adulto)))
        );
    }

    // --- manejadores --------------------------------------------------------

    private static int menu(CommandContext<ServerCommandSource> contexto) throws CommandSyntaxException {
        ElyDialogue.abrirMenu(jugador(contexto));
        return 1;
    }

    private static int ayuda(CommandContext<ServerCommandSource> contexto) {
        ServerCommandSource fuente = contexto.getSource();
        fuente.sendFeedback(() -> Text.translatable("elylang.ayuda.1"), false);
        fuente.sendFeedback(() -> Text.translatable("elylang.ayuda.2"), false);
        fuente.sendFeedback(() -> Text.translatable("elylang.ayuda.3"), false);
        fuente.sendFeedback(() -> Text.translatable("elylang.ayuda.4"), false);
        fuente.sendFeedback(() -> Text.translatable("elylang.ayuda.5"), false);
        fuente.sendFeedback(() -> Text.translatable("elylang.ayuda.6"), false);
        fuente.sendFeedback(() -> Text.translatable("elylang.ayuda.7"), false);
        return 1;
    }

    private static int estado(CommandContext<ServerCommandSource> contexto) throws CommandSyntaxException {
        ServerPlayerEntity jugador = jugador(contexto);
        ElyState estado = ElyState.get(jugador.getServer());
        int afinidad = estado.afinidad(jugador.getUuid());

        jugador.sendMessage(Text.translatable("elylang.cabecera",
            Text.translatable(ElyDialogue.estadoClave(afinidad)), String.valueOf(afinidad))
            .formatted(Formatting.LIGHT_PURPLE), false);
        jugador.sendMessage(Text.translatable("elylang.estado.genero", estado.genero(jugador.getUuid()))
            .formatted(Formatting.GRAY), false);
        jugador.sendMessage(Text.translatable("elylang.estado.adulto", estado.esAdulto(jugador.getUuid()))
            .formatted(Formatting.GRAY), false);
        return 1;
    }

    private static int genero(CommandContext<ServerCommandSource> contexto) throws CommandSyntaxException {
        ServerPlayerEntity jugador = jugador(contexto);
        String valor = StringArgumentType.getString(contexto, "valor");
        ElyState estado = ElyState.get(jugador.getServer());

        if (!estado.setGenero(jugador.getUuid(), valor)) {
            contexto.getSource().sendError(Text.translatable("elylang.genero.invalido"));
            return 0;
        }

        jugador.sendMessage(Text.translatable("elylang.genero.ok", valor).formatted(Formatting.LIGHT_PURPLE), false);
        ElyDialogue.mostrar(jugador, "quien");
        return 1;
    }

    private static int elegir(CommandContext<ServerCommandSource> contexto) throws CommandSyntaxException {
        ServerPlayerEntity jugador = jugador(contexto);
        String nodo = StringArgumentType.getString(contexto, "nodo");
        int indice = IntegerArgumentType.getInteger(contexto, "indice");
        ElyDialogue.elegir(jugador, nodo, indice);
        return 1;
    }

    private static int picar(CommandContext<ServerCommandSource> contexto) throws CommandSyntaxException {
        ElyActions.picar(jugador(contexto));
        return 1;
    }

    private static int minar(CommandContext<ServerCommandSource> contexto) throws CommandSyntaxException {
        ElyActions.minar(jugador(contexto));
        return 1;
    }

    private static int proteger(CommandContext<ServerCommandSource> contexto) throws CommandSyntaxException {
        ElyActions.proteger(jugador(contexto));
        return 1;
    }

    private static int flor(CommandContext<ServerCommandSource> contexto) throws CommandSyntaxException {
        ElyActions.flor(jugador(contexto));
        return 1;
    }

    private static int acariciar(CommandContext<ServerCommandSource> contexto) throws CommandSyntaxException {
        ElyActions.acariciar(jugador(contexto));
        return 1;
    }

    private static int intimidad(CommandContext<ServerCommandSource> contexto) throws CommandSyntaxException {
        ElyActions.intimidad(jugador(contexto));
        return 1;
    }

    private static int afinidad(CommandContext<ServerCommandSource> contexto) throws CommandSyntaxException {
        ServerPlayerEntity jugador = jugador(contexto);
        int valor = IntegerArgumentType.getInteger(contexto, "valor");
        ElyState estado = ElyState.get(jugador.getServer());
        estado.setAfinidad(jugador.getUuid(), valor);
        jugador.sendMessage(Text.translatable("elylang.afinidad.fijada", valor).formatted(Formatting.LIGHT_PURPLE), false);
        return 1;
    }

    private static int avisoAdulto(CommandContext<ServerCommandSource> contexto) {
        contexto.getSource().sendFeedback(() -> Text.translatable("elylang.adulto.aviso").formatted(Formatting.YELLOW), false);
        return 1;
    }

    private static int adulto(CommandContext<ServerCommandSource> contexto) throws CommandSyntaxException {
        ServerPlayerEntity jugador = jugador(contexto);
        ElyState.get(jugador.getServer()).confirmarAdulto(jugador.getUuid());
        jugador.sendMessage(Text.translatable("elylang.adulto.ok").formatted(Formatting.GREEN), false);
        return 1;
    }

    private static ServerPlayerEntity jugador(CommandContext<ServerCommandSource> contexto) throws CommandSyntaxException {
        return contexto.getSource().getPlayerOrThrow();
    }
}
