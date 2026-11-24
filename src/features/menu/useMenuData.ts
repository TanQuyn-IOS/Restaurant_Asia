import { useMemo } from 'react';
import { useRestaurantStore } from '@/store/useRestaurantStore';
import type {
  ChiTietCombo,
  CuisineSchool,
  DanhMucMon,
  DinhMucMon,
  MonAn,
  NguyenLieu,
} from '@/types/database';
import {
  computeEffectiveBomQty,
  computeMenuFilterCounts,
  computeMenuStats,
  type MenuFilterKey,
  type MenuStats,
} from './menuHelpers';

export interface EnrichedBomItem {
  bom: DinhMucMon;
  ingredient: NguyenLieu | null;
  effectiveQty: number;
  isLowStock: boolean;
}

export interface EnrichedComboComponent {
  item: ChiTietCombo;
  dish: MonAn | null;
  lineValue: number;
}

export interface EnrichedDishRow {
  dish: MonAn;
  category: DanhMucMon | null;
  cuisineSchool: CuisineSchool | null;
  bomItems: EnrichedBomItem[];
  comboComponents: EnrichedComboComponent[];
  comboStandaloneTotal: number;
  ingredientNames: string[];
}

export function useMenuData(): {
  rows: EnrichedDishRow[];
  categories: DanhMucMon[];
  stats: MenuStats;
  filterCounts: Record<MenuFilterKey, number>;
} {
  const dishes = useRestaurantStore((s) => s.snapshot.tbl_mon_an);
  const categories = useRestaurantStore((s) => s.snapshot.tbl_danh_muc_mon);
  const bomList = useRestaurantStore((s) => s.snapshot.tbl_dinh_muc_mon);
  const ingredients = useRestaurantStore((s) => s.snapshot.tbl_nguyen_lieu);
  const comboDetails = useRestaurantStore((s) => s.snapshot.tbl_chi_tiet_combo);

  return useMemo(() => {
    const categoriesById = new Map(categories.map((c) => [c.ma_danh_muc, c]));
    const ingredientsById = new Map(ingredients.map((n) => [n.ma_nguyen_lieu, n]));
    const dishesById = new Map(dishes.map((d) => [d.ma_mon_an, d]));

    const bomByDish = new Map<string, EnrichedBomItem[]>();
    for (const bom of bomList) {
      const ingredient = ingredientsById.get(bom.ma_nguyen_lieu) ?? null;
      const entry: EnrichedBomItem = {
        bom,
        ingredient,
        effectiveQty: computeEffectiveBomQty(bom),
        isLowStock: ingredient
          ? ingredient.so_luong_ton_kho < ingredient.nguong_ton_toi_thieu
          : false,
      };
      const existing = bomByDish.get(bom.ma_mon_an);
      if (existing) existing.push(entry);
      else bomByDish.set(bom.ma_mon_an, [entry]);
    }

    const comboByDish = new Map<string, EnrichedComboComponent[]>();
    for (const item of comboDetails) {
      const subDish = dishesById.get(item.ma_mon_thanh_phan) ?? null;
      const entry: EnrichedComboComponent = {
        item,
        dish: subDish,
        lineValue: (subDish?.don_gia ?? 0) * item.so_luong_mon,
      };
      const existing = comboByDish.get(item.ma_combo);
      if (existing) existing.push(entry);
      else comboByDish.set(item.ma_combo, [entry]);
    }

    const rows: EnrichedDishRow[] = dishes.map((dish) => {
      const category = categoriesById.get(dish.ma_danh_muc) ?? null;
      const dishBom = bomByDish.get(dish.ma_mon_an) ?? [];
      const dishCombo = dish.is_combo ? (comboByDish.get(dish.ma_mon_an) ?? []) : [];
      const comboStandaloneTotal = dishCombo.reduce((sum, c) => sum + c.lineValue, 0);

      return {
        dish,
        category,
        cuisineSchool: category?.truong_phai_am_thuc ?? null,
        bomItems: dishBom,
        comboComponents: dishCombo,
        comboStandaloneTotal,
        ingredientNames: dishBom
          .map((b) => b.ingredient?.ten_nguyen_lieu ?? '')
          .filter(Boolean),
      };
    });

    const sortedCategories = [...categories].sort(
      (a, b) => a.thu_tu_hien_thi - b.thu_tu_hien_thi,
    );

    return {
      rows,
      categories: sortedCategories,
      stats: computeMenuStats(dishes),
      filterCounts: computeMenuFilterCounts(dishes, categoriesById),
    };
  }, [dishes, categories, bomList, ingredients, comboDetails]);
}
