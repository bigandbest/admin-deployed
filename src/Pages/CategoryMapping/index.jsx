import React, { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  Title,
  Text,
  LoadingOverlay,
  Divider,
} from "@mantine/core";
import {
  getAllCategories,
  getAllSubcategories,
  getAllProductSections,
} from "../../utils/supabaseApi";
import SectionMappingManager from "../../Components/SectionMappingManager";

const CategoryMapping = () => {
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [categoriesRes, subcategoriesRes] = await Promise.all([
          getAllCategories(),
          getAllSubcategories(),
        ]);

        if (categoriesRes.success) {
          setCategories(categoriesRes.categories || []);
        }

        if (subcategoriesRes.success) {
          setSubcategories(subcategoriesRes.subcategories || []);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch product sections once and share across every SectionMappingManager
  // instance below, instead of each one independently calling
  // getSectionByKey() -> GET /product-sections (was 6-7x duplicate calls).
  const { data: sectionsResult, isLoading: sectionsLoading } = useQuery({
    queryKey: ["product-sections"],
    queryFn: getAllProductSections,
  });

  const sectionsByKey = useMemo(() => {
    const map = {};
    if (sectionsResult?.success && Array.isArray(sectionsResult.data)) {
      sectionsResult.data.forEach((section) => {
        map[section.section_key] = section;
      });
    }
    return map;
  }, [sectionsResult]);

  return (
    <div className="p-6 mantine-bg min-h-screen">
      <Card shadow="sm" p="lg" radius="md" className="mantine-card mb-6">
        <LoadingOverlay visible={loading || sectionsLoading} />

        <Title order={2} mb="md">Manage Section Mappings</Title>
        <Text size="sm" color="dimmed" mb="xl">
          Control which categories and subcategories appear in PriceZone and ShopByCategory sections
        </Text>

        {/* PriceZone Section */}
        <SectionMappingManager
          sectionKey="price_zone"
          sectionName="Price Zone"
          mappingType="subcategory"
          categories={categories}
          subcategories={subcategories}
          sectionsByKey={sectionsByKey}
        />

        <Divider my="xl" />

        {/* ShopByCategory Section */}
        <SectionMappingManager
          sectionKey="shop_by_category"
          sectionName="Shop By Category"
          mappingType="both"
          categories={categories}
          subcategories={subcategories}
          sectionsByKey={sectionsByKey}
        />

        <Divider my="xl" />

        {/* Dual Deals - Left Section */}
        <SectionMappingManager
          sectionKey="dual_deals_left"
          sectionName="Dual Deals - Best Selling (Left)"
          mappingType="category"
          categories={categories}
          subcategories={subcategories}
          sectionsByKey={sectionsByKey}
          singleSelect={true}
        />

        <Divider my="xl" />

        {/* Dual Deals - Right Section */}
        <SectionMappingManager
          sectionKey="dual_deals_right"
          sectionName="Dual Deals - Trending (Right)"
          mappingType="category"
          categories={categories}
          subcategories={subcategories}
          sectionsByKey={sectionsByKey}
          singleSelect={true}
        />

        <Divider my="xl" />

        {/* Discount Corner - Left Section */}
        <SectionMappingManager
          sectionKey="discount_corner_left"
          sectionName="Discount Corner - Left Panel"
          mappingType="category"
          categories={categories}
          subcategories={subcategories}
          sectionsByKey={sectionsByKey}
          singleSelect={true}
        />

        <Divider my="xl" />

        {/* Discount Corner - Right Section */}
        <SectionMappingManager
          sectionKey="discount_corner_right"
          sectionName="Discount Corner - Right Panel"
          mappingType="category"
          categories={categories}
          subcategories={subcategories}
          sectionsByKey={sectionsByKey}
          singleSelect={true}
        />

        <Divider my="xl" />

        {/* Mega Monsoon Section */}
        <SectionMappingManager
          sectionKey="mega_monsoon"
          sectionName="Mega Monsoon Sale"
          mappingType="both"
          categories={categories}
          subcategories={subcategories}
          sectionsByKey={sectionsByKey}
        />
      </Card>
    </div>
  );
};

export default CategoryMapping;
