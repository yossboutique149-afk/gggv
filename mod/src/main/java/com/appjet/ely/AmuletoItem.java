package com.appjet.ely;

import net.minecraft.entity.player.PlayerEntity;
import net.minecraft.item.Item;
import net.minecraft.item.ItemStack;
import net.minecraft.server.network.ServerPlayerEntity;
import net.minecraft.util.Hand;
import net.minecraft.util.TypedActionResult;
import net.minecraft.world.World;

/**
 * Amuleto del Corazón: al usarlo abre el diálogo con Ely.
 * También admite clic derecho en el aire desde el cliente.
 */
public class AmuletoItem extends Item {

    public AmuletoItem(Settings settings) {
        super(settings);
    }

    @Override
    public TypedActionResult<ItemStack> use(World world, PlayerEntity user, Hand hand) {
        ItemStack enMano = user.getStackInHand(hand);
        if (!world.isClient() && user instanceof ServerPlayerEntity player) {
            ElyDialogue.abrirMenu(player);
        }
        return TypedActionResult.success(enMano);
    }

    @Override
    public boolean hasGlint(ItemStack stack) {
        return true;
    }
}
