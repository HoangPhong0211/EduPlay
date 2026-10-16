using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BE.Migrations
{
    /// <inheritdoc />
    public partial class AlignCurrentModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "OptionA",
                table: "Questions",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OptionB",
                table: "Questions",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OptionC",
                table: "Questions",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OptionD",
                table: "Questions",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Lessons_TopicId",
                table: "Lessons",
                column: "TopicId");

            migrationBuilder.AddForeignKey(
                name: "FK_Lessons_Topics_TopicId",
                table: "Lessons",
                column: "TopicId",
                principalTable: "Topics",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Parents_Users_UserId",
                table: "Parents",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Students_Users_UserId",
                table: "Students",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Lessons_Topics_TopicId",
                table: "Lessons");

            migrationBuilder.DropForeignKey(
                name: "FK_Parents_Users_UserId",
                table: "Parents");

            migrationBuilder.DropForeignKey(
                name: "FK_Students_Users_UserId",
                table: "Students");

            migrationBuilder.DropIndex(
                name: "IX_Lessons_TopicId",
                table: "Lessons");

            migrationBuilder.DropColumn(
                name: "OptionA",
                table: "Questions");

            migrationBuilder.DropColumn(
                name: "OptionB",
                table: "Questions");

            migrationBuilder.DropColumn(
                name: "OptionC",
                table: "Questions");

            migrationBuilder.DropColumn(
                name: "OptionD",
                table: "Questions");

        }
    }
}
