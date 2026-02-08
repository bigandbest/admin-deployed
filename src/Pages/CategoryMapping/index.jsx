import React, { useState, useEffect } from "react";
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

  return (
    <div className="p-6 mantine-bg min-h-screen">
      <Card shadow="sm" p="lg" radius="md" className="mantine-card mb-6">
        <LoadingOverlay visible={loading} />

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
        />

        <Divider my="xl" />

        {/* ShopByCategory Section */}
        <SectionMappingManager
          sectionKey="shop_by_category"
          sectionName="Shop By Category"
          mappingType="both"
          categories={categories}
          subcategories={subcategories}
        />

        <Divider my="xl" />

        {/* Dual Deals - Left Section */}
        <SectionMappingManager
          sectionKey="dual_deals_left"
          sectionName="Dual Deals - Best Selling (Left)"
          mappingType="category"
          categories={categories}
          subcategories={subcategories}
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
        />
      </Card>
    </div>
  );
};

export default CategoryMapping;
