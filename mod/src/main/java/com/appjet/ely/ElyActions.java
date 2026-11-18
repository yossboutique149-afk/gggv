package com.appjet.ely;

import net.minecraft.block.Block;
import net.minecraft.block.Blocks;
import net.minecraft.entity.Entity;
import net.minecraft.entity.LivingEntity;
import net.minecraft.entity.effect.StatusEffectInstance;
import net.minecraft.entity.effect.StatusEffects;
import net.minecraft.entity.mob.HostileEntity;
import net.minecraft.item.ItemStack;
import net.minecraft.item.Items;
import net.minecraft.network.packet.s2c.play.SubtitleS2CPacket;
import net.minecraft.network.packet.s2c.play.TitleFadeS2CPacket;
import net.minecraft.network.packet.s2c.play.TitleS2CPacket;
import net.minecraft.particle.ParticleTypes;
import net.minecraft.registry.tag.BlockTags;
import net.minecraft.server.MinecraftServer;
import net.minecraft.server.network.ServerPlayerEntity;
import net.minecraft.server.world.ServerWorld;
import net.minecraft.sound.SoundCategory;
import net.minecraft.sound.SoundEvents;
import net.minecraft.text.Text;
import net.minecraft.util.Formatting;
import net.minecraft.util.math.BlockPos;
import net.minecraft.util.math.Box;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

/** Acciones que Ely realiza para el jugador. */
public final class ElyActions {

    private static final Set<Block> MENAS = Set.of(
        Blocks.COAL_ORE, Blocks.DEEPSLATE_COAL_ORE,
        Blocks.IRON_ORE, Blocks.DEEPSLATE_IRON_ORE,
        Blocks.COPPER_ORE, Blocks.DEEPSLATE_COPPER_ORE,
        Blocks.GOLD_ORE, Blocks.DEEPSLATE_GOLD_ORE,
        Blocks.REDSTONE_ORE, Blocks.DEEPSLATE_REDSTONE_ORE,
        Blocks.LAPIS_ORE, Blocks.DEEPSLATE_LAPIS_ORE,
        Blocks.DIAMOND_ORE, Blocks.DEEPSLATE_DIAMOND_ORE,
        Blocks.EMERALD_ORE, Blocks.DEEPSLATE_EMERALD_ORE,
        Blocks.NETHER_QUARTZ_ORE, Blocks.NETHER_GOLD_ORE,
        Blocks.ANCIENT_DEBRIS
    );

    private static int tic = 0;

    private ElyActions() {
    }

    /** Corazones ambientales cuando Ely está muy enamorada. */
    public static void tick(MinecraftServer servidor) {
        tic++;
        if (tic % 100 != 0) {
            return;
        }
        ElyState estado = ElyState.get(servidor);
        for (ServerPlayerEntity jugador : servidor.getPlayerManager().getPlayerList()) {
            if (estado.afinidad(jugador.getUuid()) < 75) {
                continue;
            }
            jugador.getServerWorld().spawnParticles(
                ParticleTypes.HEART,
                jugador.getX(), jugador.getY() + 2.2, jugador.getZ(),
                2, 0.35, 0.25, 0.35, 0.0
            );
        }
    }

    // --- acciones del bosque ------------------------------------------------

    public static void picar(ServerPlayerEntity jugador) {
        ServerWorld mundo = jugador.getServerWorld();
        BlockPos base = jugador.getBlockPos();
        List<BlockPos> troncos = new ArrayList<>();

        for (BlockPos pos : BlockPos.iterate(base.add(-4, -1, -4), base.add(4, 3, 4))) {
            if (troncos.size() >= 16) {
                break;
            }
            if (mundo.getBlockState(pos).isIn(BlockTags.LOGS)) {
                troncos.add(pos.toImmutable());
            }
        }

        if (troncos.isEmpty()) {
            jugador.sendMessage(Text.translatable("elylang.accion.picar.vacio").formatted(Formatting.GRAY), false);
            return;
        }

        for (BlockPos pos : troncos) {
            mundo.breakBlock(pos, true, jugador);
        }
        mundo.playSound(null, base, SoundEvents.BLOCK_WOOD_BREAK, SoundCategory.PLAYERS, 1.0f, 1.0f);

        jugador.sendMessage(Text.translatable("elylang.accion.picar.ok", troncos.size()).formatted(Formatting.GREEN), false);
        premiar(jugador, 4);
    }

    public static void minar(ServerPlayerEntity jugador) {
        ServerWorld mundo = jugador.getServerWorld();
        BlockPos base = jugador.getBlockPos();
        List<BlockPos> menas = new ArrayList<>();

        for (BlockPos pos : BlockPos.iterate(base.add(-4, -8, -4), base.add(4, 2, 4))) {
            if (menas.size() >= 12) {
                break;
            }
            Block bloque = mundo.getBlockState(pos).getBlock();
            if (MENAS.contains(bloque)) {
                menas.add(pos.toImmutable());
            }
        }

        if (menas.isEmpty()) {
            jugador.sendMessage(Text.translatable("elylang.accion.minar.vacio").formatted(Formatting.GRAY), false);
            return;
        }

        for (BlockPos pos : menas) {
            mundo.breakBlock(pos, true, jugador);
        }
        mundo.playSound(null, base, SoundEvents.BLOCK_STONE_BREAK, SoundCategory.PLAYERS, 1.0f, 0.8f);

        jugador.sendMessage(Text.translatable("elylang.accion.minar.ok", menas.size()).formatted(Formatting.GREEN), false);
        premiar(jugador, 6);
    }

    public static void proteger(ServerPlayerEntity jugador) {
        ServerWorld mundo = jugador.getServerWorld();
        Box area = new Box(jugador.getBlockPos()).expand(12.0, 6.0, 12.0);
        int derrotados = 0;

        for (Entity entidad : mundo.getOtherEntities(jugador, area)) {
            if (!(entidad instanceof HostileEntity hostil) || !hostil.isAlive()) {
                continue;
            }
            if (hostil.distanceTo(jugador) > 12.0f) {
                continue;
            }
            mundo.spawnParticles(ParticleTypes.CRIT, hostil.getX(), hostil.getY() + 1.0, hostil.getZ(), 8, 0.3, 0.3, 0.3, 0.1);
            hostil.damage(mundo.getDamageSources().magic(), 8.0f);
            derrotados++;
        }

        if (derrotados == 0) {
            jugador.sendMessage(Text.translatable("elylang.accion.proteger.vacio").formatted(Formatting.GRAY), false);
            return;
        }

        mundo.playSound(null, jugador.getBlockPos(), SoundEvents.ITEM_SHIELD_BLOCK, SoundCategory.PLAYERS, 1.0f, 1.2f);
        jugador.sendMessage(Text.translatable("elylang.accion.proteger.ok", derrotados).formatted(Formatting.GREEN), false);
        premiar(jugador, 6);
    }

    public static void flor(ServerPlayerEntity jugador) {
        jugador.getInventory().insertStack(new ItemStack(Items.POPPY, 2));
        jugador.getInventory().insertStack(new ItemStack(Items.CORNFLOWER, 1));
        jugador.getServerWorld().spawnParticles(
            ParticleTypes.HEART,
            jugador.getX(), jugador.getY() + 1.5, jugador.getZ(),
            6, 0.4, 0.4, 0.4, 0.0
        );
        jugador.sendMessage(Text.translatable("elylang.accion.flor.ok").formatted(Formatting.LIGHT_PURPLE), false);
        premiar(jugador, 5);
    }

    public static void acariciar(ServerPlayerEntity jugador) {
        corazones(jugador.getServerWorld(), jugador, 6);
        jugador.sendMessage(Text.translatable("elylang.accion.acariciar.ok").formatted(Formatting.LIGHT_PURPLE), false);
        premiar(jugador, 3);
    }

    // --- romance no explícito ----------------------------------------------

    /** Devuelve el motivo por el que la noche no puede ocurrir, o null si puede. */
    public static Text bloqueoIntimidad(ServerPlayerEntity jugador) {
        ElyState estado = ElyState.get(jugador.getServer());
        if (!estado.esAdulto(jugador.getUuid())) {
            return Text.translatable("elylang.accion.intimidad.menor").formatted(Formatting.RED);
        }
        int afinidad = estado.afinidad(jugador.getUuid());
        if (afinidad < 75) {
            return Text.translatable("elylang.accion.intimidad.afinidad", afinidad).formatted(Formatting.YELLOW);
        }
        ServerWorld mundo = jugador.getServerWorld();
        long ahora = mundo.getTime();
        long ultima = estado.ultimaIntimidad(jugador.getUuid());
        long transcurrido = ahora - ultima;
        if (transcurrido < ElyState.RECARGA_INTIMIDAD) {
            long falta = ElyState.RECARGA_INTIMIDAD - transcurrido;
            return Text.translatable("elylang.accion.intimidad.espera", (falta / 20L) / 60L).formatted(Formatting.YELLOW);
        }
        if (!mundo.isNight()) {
            return Text.translatable("elylang.accion.intimidad.dia").formatted(Formatting.YELLOW);
        }
        return null;
    }

    /**
     * Noche de pasión: se resuelve con un fundido a negro. No se describe
     * ningún contenido sexual explícito, solo afecto y consecuencias en el juego.
     */
    public static void intimidad(ServerPlayerEntity jugador) {
        Text bloqueo = bloqueoIntimidad(jugador);
        if (bloqueo != null) {
            jugador.sendMessage(bloqueo, false);
            return;
        }

        ElyState estado = ElyState.get(jugador.getServer());
        estado.marcarIntimidad(jugador.getUuid(), jugador.getServerWorld().getTime());

        fundido(jugador,
            Text.translatable("elylang.accion.intimidad.titulo"),
            Text.translatable("elylang.accion.intimidad.subtitulo"));

        jugador.addStatusEffect(new StatusEffectInstance(StatusEffects.REGENERATION, 200, 1));
        corazones(jugador.getServerWorld(), jugador, 12);

        jugador.sendMessage(Text.translatable("elylang.accion.intimidad.ok").formatted(Formatting.LIGHT_PURPLE), false);
        premiar(jugador, 10);
    }

    // --- utilidades ---------------------------------------------------------

    private static void premiar(ServerPlayerEntity jugador, int delta) {
        ElyState estado = ElyState.get(jugador.getServer());
        int nueva = estado.sumarAfinidad(jugador.getUuid(), delta);
        jugador.sendMessage(
            Text.translatable("elylang.accion.afinidad", "+" + delta, nueva).formatted(Formatting.LIGHT_PURPLE),
            false
        );
    }

    private static void corazones(ServerWorld mundo, LivingEntity centro, int cantidad) {
        mundo.spawnParticles(
            ParticleTypes.HEART,
            centro.getX(), centro.getY() + 1.8, centro.getZ(),
            cantidad, 0.5, 0.5, 0.5, 0.0
        );
    }

    private static void fundido(ServerPlayerEntity jugador, Text titulo, Text subtitulo) {
        jugador.networkHandler.sendPacket(new TitleFadeS2CPacket(10, 40, 20));
        jugador.networkHandler.sendPacket(new TitleS2CPacket(titulo));
        jugador.networkHandler.sendPacket(new SubtitleS2CPacket(subtitulo));
    }
}
