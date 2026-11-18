package com.appjet.ely;

import net.fabricmc.fabric.api.itemgroup.v1.ItemGroupEvents;
import net.minecraft.item.Item;
import net.minecraft.item.ItemGroups;
import net.minecraft.registry.Registries;
import net.minecraft.registry.Registry;
import net.minecraft.util.Identifier;
import net.minecraft.util.Rarity;

/** Registro de los objetos del mod. */
public final class ElyItems {

    /** Objeto para dialogar con Ely. */
    public static final Item AMULETO = new AmuletoItem(
        new Item.Settings().maxCount(1).rarity(Rarity.RARE)
    );

    private ElyItems() {
    }

    public static void register() {
        Registry.register(Registries.ITEM, Identifier.of(ElyMod.MOD_ID, "amuleto_corazon"), AMULETO);
        ItemGroupEvents.modifyEntriesEvent(ItemGroups.TOOLS).register(entries -> entries.add(AMULETO));
    }
}
