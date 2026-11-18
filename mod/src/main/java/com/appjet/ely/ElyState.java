package com.appjet.ely;

import net.minecraft.nbt.NbtCompound;
import net.minecraft.registry.RegistryWrapper;
import net.minecraft.server.MinecraftServer;
import net.minecraft.world.PersistentState;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Estado persistente del mod: afinidad, género elegido, confirmación de edad,
 * entrega del amuleto y última noche de pasión, por jugador.
 */
public class ElyState extends PersistentState {
    private static final String CLAVE = "elylang_companera";

    /** Tipo de estado persistente que registra el gestor de estado del mundo. */
    public static final PersistentState.Type<ElyState> TIPO =
        new PersistentState.Type<>(ElyState::new, ElyState::fromNbt, null);

    public static final int AFINIDAD_INICIAL = 20;
    public static final int AFINIDAD_MAXIMA = 100;
    public static final long RECARGA_INTIMIDAD = 24000L;

    private final Map<UUID, Integer> afinidad = new HashMap<>();
    private final Map<UUID, String> generos = new HashMap<>();
    private final Map<UUID, Boolean> amuletoEntregado = new HashMap<>();
    private final Map<UUID, Boolean> adultos = new HashMap<>();
    private final Map<UUID, Long> ultimaIntimidad = new HashMap<>();

    public static ElyState get(MinecraftServer server) {
        return server.getOverworld()
            .getPersistentStateManager()
            .getOrCreate(TIPO, CLAVE);
    }

    // --- afinidad -----------------------------------------------------------

    public int afinidad(UUID id) {
        return afinidad.getOrDefault(id, AFINIDAD_INICIAL);
    }

    public void setAfinidad(UUID id, int valor) {
        afinidad.put(id, Math.max(0, Math.min(AFINIDAD_MAXIMA, valor)));
        markDirty();
    }

    public int sumarAfinidad(UUID id, int delta) {
        int nuevo = Math.max(0, Math.min(AFINIDAD_MAXIMA, afinidad(id) + delta));
        afinidad.put(id, nuevo);
        markDirty();
        return nuevo;
    }

    // --- género -------------------------------------------------------------

    public String genero(UUID id) {
        return generos.getOrDefault(id, "femenino");
    }

    public boolean tieneGenero(UUID id) {
        return generos.containsKey(id);
    }

    public boolean setGenero(UUID id, String valor) {
        if (!valor.equals("femenino") && !valor.equals("masculino") && !valor.equals("neutro")) {
            return false;
        }
        generos.put(id, valor);
        markDirty();
        return true;
    }

    // --- resto de banderas --------------------------------------------------

    public boolean amuletoEntregado(UUID id) {
        return amuletoEntregado.getOrDefault(id, false);
    }

    public void marcarAmuleto(UUID id) {
        amuletoEntregado.put(id, true);
        markDirty();
    }

    public boolean esAdulto(UUID id) {
        return adultos.getOrDefault(id, false);
    }

    public void confirmarAdulto(UUID id) {
        adultos.put(id, true);
        markDirty();
    }

    public long ultimaIntimidad(UUID id) {
        return ultimaIntimidad.getOrDefault(id, Long.MIN_VALUE / 2);
    }

    public void marcarIntimidad(UUID id, long tiempo) {
        ultimaIntimidad.put(id, tiempo);
        markDirty();
    }

    // --- serialización ------------------------------------------------------

    public static ElyState fromNbt(NbtCompound nbt, RegistryWrapper.WrapperLookup lookup) {
        ElyState estado = new ElyState();
        leerEnteros(nbt, "afinidad", estado.afinidad);
        leerBooleanos(nbt, "amuleto", estado.amuletoEntregado);
        leerBooleanos(nbt, "adultos", estado.adultos);
        leerLargos(nbt, "intimidad", estado.ultimaIntimidad);
        leerTextos(nbt, "generos", estado.generos);
        return estado;
    }

    @Override
    public NbtCompound writeNbt(NbtCompound nbt, RegistryWrapper.WrapperLookup lookup) {
        nbt.put("afinidad", escribirEnteros(afinidad));
        nbt.put("amuleto", escribirBooleanos(amuletoEntregado));
        nbt.put("adultos", escribirBooleanos(adultos));
        nbt.put("intimidad", escribirLargos(ultimaIntimidad));
        nbt.put("generos", escribirTextos(generos));
        return nbt;
    }

    private static NbtCompound escribirEnteros(Map<UUID, Integer> mapa) {
        NbtCompound compuesto = new NbtCompound();
        mapa.forEach((id, valor) -> compuesto.putInt(id.toString(), valor));
        return compuesto;
    }

    private static NbtCompound escribirBooleanos(Map<UUID, Boolean> mapa) {
        NbtCompound compuesto = new NbtCompound();
        mapa.forEach((id, valor) -> compuesto.putBoolean(id.toString(), valor));
        return compuesto;
    }

    private static NbtCompound escribirLargos(Map<UUID, Long> mapa) {
        NbtCompound compuesto = new NbtCompound();
        mapa.forEach((id, valor) -> compuesto.putLong(id.toString(), valor));
        return compuesto;
    }

    private static NbtCompound escribirTextos(Map<UUID, String> mapa) {
        NbtCompound compuesto = new NbtCompound();
        mapa.forEach((id, valor) -> compuesto.putString(id.toString(), valor));
        return compuesto;
    }

    private static void leerEnteros(NbtCompound nbt, String clave, Map<UUID, Integer> destino) {
        if (!nbt.contains(clave)) {
            return;
        }
        NbtCompound compuesto = nbt.getCompound(clave);
        for (String k : compuesto.getKeys()) {
            UUID id = parsear(k);
            if (id != null) {
                destino.put(id, compuesto.getInt(k));
            }
        }
    }

    private static void leerBooleanos(NbtCompound nbt, String clave, Map<UUID, Boolean> destino) {
        if (!nbt.contains(clave)) {
            return;
        }
        NbtCompound compuesto = nbt.getCompound(clave);
        for (String k : compuesto.getKeys()) {
            UUID id = parsear(k);
            if (id != null) {
                destino.put(id, compuesto.getBoolean(k));
            }
        }
    }

    private static void leerLargos(NbtCompound nbt, String clave, Map<UUID, Long> destino) {
        if (!nbt.contains(clave)) {
            return;
        }
        NbtCompound compuesto = nbt.getCompound(clave);
        for (String k : compuesto.getKeys()) {
            UUID id = parsear(k);
            if (id != null) {
                destino.put(id, compuesto.getLong(k));
            }
        }
    }

    private static void leerTextos(NbtCompound nbt, String clave, Map<UUID, String> destino) {
        if (!nbt.contains(clave)) {
            return;
        }
        NbtCompound compuesto = nbt.getCompound(clave);
        for (String k : compuesto.getKeys()) {
            UUID id = parsear(k);
            if (id != null) {
                destino.put(id, compuesto.getString(k));
            }
        }
    }

    private static UUID parsear(String texto) {
        try {
            return UUID.fromString(texto);
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }
}
