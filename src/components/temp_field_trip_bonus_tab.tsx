        {/* Laporan Fee & Bonus Field Trip */}
        <TabsContent value="field-trip-bonus" className="space-y-4">
          <FieldTripBonusReport
            accessToken={accessToken}
            filters={filters}
            onPrint={onPrint}
          />
        </TabsContent>