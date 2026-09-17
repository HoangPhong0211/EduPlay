using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BE.Migrations
{
    /// <inheritdoc />
    public partial class AddNavigationProperties : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_StudentBadges_BadgeId",
                table: "StudentBadges",
                column: "BadgeId");

            migrationBuilder.AddForeignKey(
                name: "FK_StudentBadges_Badges_BadgeId",
                table: "StudentBadges",
                column: "BadgeId",
                principalTable: "Badges",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_StudentBadges_Students_StudentId",
                table: "StudentBadges",
                column: "StudentId",
                principalTable: "Students",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_StudentBadges_Badges_BadgeId",
                table: "StudentBadges");

            migrationBuilder.DropForeignKey(
                name: "FK_StudentBadges_Students_StudentId",
                table: "StudentBadges");

            migrationBuilder.DropIndex(
                name: "IX_StudentBadges_BadgeId",
                table: "StudentBadges");
        }
    }
}
